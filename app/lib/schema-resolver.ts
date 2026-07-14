import { encode, resolveSchema } from "@jsonforms/core";
import type { JsonSchema } from "@jsonforms/core";

export interface SchemaEntry {
  /** Resolved schema used to render this field. */
  schema: JsonSchema;
  /** JSON Pointer to the first schema declaration for this field. */
  schemaPath: string;
  /** Human-readable path used by column overrides. */
  dataPath: string;
  /** Exact property segments used to read row data safely. */
  dataSegments: string[];
}

export interface NormalizedRowSchema {
  rootSchema: JsonSchema;
  rowSchema: JsonSchema;
}

export interface PartitionedSchemaEntries {
  columnEntries: SchemaEntry[];
  arrayEntries: SchemaEntry[];
}

const isSchemaObject = (value: unknown): value is JsonSchema =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const resolveReference = (schema: JsonSchema, rootSchema: JsonSchema): JsonSchema | undefined => {
  if (!schema.$ref) return schema;
  return resolveSchema(rootSchema, schema.$ref, rootSchema);
};

const dereferenceSchema = (schema: JsonSchema, rootSchema: JsonSchema): JsonSchema => {
  if (!schema.$ref) return schema;

  const resolved = resolveReference(schema, rootSchema);
  if (!resolved) return schema;

  const { $ref: _ref, ...siblings } = schema;
  return { ...resolved, ...siblings };
};

const schemaHasObjectShape = (
  schema: JsonSchema,
  rootSchema: JsonSchema,
  visitedRefs = new Set<string>()
): boolean => {
  if (schema.$ref) {
    if (visitedRefs.has(schema.$ref)) return false;
    const nextRefs = new Set(visitedRefs).add(schema.$ref);
    const resolved = resolveReference(schema, rootSchema);
    return resolved ? schemaHasObjectShape(resolved, rootSchema, nextRefs) : false;
  }

  if (schema.type === "object" || schema.properties) return true;

  const branches = [
    ...((schema.allOf ?? []) as JsonSchema[]),
    ...((schema.oneOf ?? []) as JsonSchema[]),
    ...((schema.anyOf ?? []) as JsonSchema[]),
  ];

  return branches.some(
    (branch) => isSchemaObject(branch) && schemaHasObjectShape(branch, rootSchema, visitedRefs)
  );
};

const collectProperties = (
  schema: JsonSchema,
  rootSchema: JsonSchema,
  visitedRefs = new Set<string>()
): Record<string, JsonSchema> => {
  let current = schema;
  let nextRefs = visitedRefs;

  if (schema.$ref) {
    if (visitedRefs.has(schema.$ref)) return {};
    nextRefs = new Set(visitedRefs).add(schema.$ref);
    current = dereferenceSchema(schema, rootSchema);
  }

  const properties: Record<string, JsonSchema> = {};

  for (const [name, propertySchema] of Object.entries(current.properties ?? {})) {
    if (isSchemaObject(propertySchema)) properties[name] = propertySchema;
  }

  for (const member of (current.allOf ?? []) as JsonSchema[]) {
    if (!isSchemaObject(member)) continue;
    Object.assign(properties, collectProperties(member, rootSchema, nextRefs));
  }

  return properties;
};

const findArraySchema = (
  schema: JsonSchema,
  rootSchema: JsonSchema,
  visitedRefs = new Set<string>()
): JsonSchema | undefined => {
  let current = schema;
  let nextRefs = visitedRefs;

  if (schema.$ref) {
    if (visitedRefs.has(schema.$ref)) return undefined;
    nextRefs = new Set(visitedRefs).add(schema.$ref);
    current = dereferenceSchema(schema, rootSchema);
  }

  if (current.type === "array") return current;

  const branches = [
    ...((current.oneOf ?? []) as JsonSchema[]),
    ...((current.anyOf ?? []) as JsonSchema[]),
  ];

  for (const branch of branches) {
    if (!isSchemaObject(branch)) continue;
    const arraySchema = findArraySchema(branch, rootSchema, nextRefs);
    if (arraySchema) {
      return {
        ...arraySchema,
        ...(typeof current.title === "string" ? { title: current.title } : {}),
        ...(typeof current.description === "string" ? { description: current.description } : {}),
      };
    }
  }

  return undefined;
};

const schemaSignature = (schema: JsonSchema): string => JSON.stringify(schema);

const mergeVariantSchemas = (left: JsonSchema, right: JsonSchema): JsonSchema => {
  if (schemaSignature(left) === schemaSignature(right)) return left;

  const candidates = [left, right];
  const seen = new Set<string>();
  const variants = candidates.filter((candidate) => {
    const signature = schemaSignature(candidate);
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });

  return {
    ...(typeof left.title === "string"
      ? { title: left.title }
      : typeof right.title === "string"
        ? { title: right.title }
        : {}),
    ...(typeof left.description === "string"
      ? { description: left.description }
      : typeof right.description === "string"
        ? { description: right.description }
        : {}),
    anyOf: variants,
  };
};

const mergeArraySchemas = (left: JsonSchema, right: JsonSchema): JsonSchema => {
  if (schemaSignature(left) === schemaSignature(right)) return left;

  const leftItems = isSchemaObject(left.items) ? left.items : {};
  const rightItems = isSchemaObject(right.items) ? right.items : {};

  return {
    ...left,
    type: "array",
    items: mergeVariantSchemas(leftItems, rightItems),
  };
};

/**
 * Accept an object schema for a row, or a homogeneous top-level array schema.
 */
export const normalizeRowSchema = (schema: JsonSchema): NormalizedRowSchema => {
  const rootSchema = schema;
  const resolvedRoot = dereferenceSchema(schema, rootSchema);
  const arraySchema = findArraySchema(resolvedRoot, rootSchema);

  if (arraySchema?.type === "array" && isSchemaObject(arraySchema.items)) {
    return {
      rootSchema,
      rowSchema: dereferenceSchema(arraySchema.items, rootSchema),
    };
  }

  return { rootSchema, rowSchema: resolvedRoot };
};

/**
 * Collect scalar leaves and arrays while flattening nested object schemas.
 */
export const collectSchemaEntries = (
  schema: JsonSchema,
  rootSchema: JsonSchema = schema
): SchemaEntry[] => {
  const entries = new Map<string, SchemaEntry>();

  const addEntry = (entry: SchemaEntry, isArray: boolean) => {
    const key = JSON.stringify(entry.dataSegments);
    const existing = entries.get(key);

    if (!existing) {
      entries.set(key, entry);
      return;
    }

    existing.schema = isArray
      ? mergeArraySchemas(existing.schema, entry.schema)
      : mergeVariantSchemas(existing.schema, entry.schema);
  };

  const visit = (
    current: JsonSchema,
    schemaPath: string,
    dataSegments: string[],
    activeRefs: Set<string>
  ) => {
    let nextRefs = activeRefs;

    if (current.$ref) {
      if (activeRefs.has(current.$ref)) return;
      nextRefs = new Set(activeRefs).add(current.$ref);
    }

    const resolved = dereferenceSchema(current, rootSchema);
    const properties = collectProperties(resolved, rootSchema, nextRefs);

    for (const [propertyName, propertySchema] of Object.entries(properties)) {
      if (propertySchema.$ref && nextRefs.has(propertySchema.$ref)) continue;

      const propertySegments = [...dataSegments, propertyName];
      const propertyPath = `${schemaPath}/properties/${encode(propertyName)}`;
      const baseEntry = {
        schemaPath: propertyPath,
        dataPath: propertySegments.join("."),
        dataSegments: propertySegments,
      };
      const arraySchema = findArraySchema(propertySchema, rootSchema, nextRefs);

      if (arraySchema) {
        addEntry({ ...baseEntry, schema: arraySchema }, true);
      } else if (schemaHasObjectShape(propertySchema, rootSchema, nextRefs)) {
        visit(propertySchema, propertyPath, propertySegments, nextRefs);
      } else {
        addEntry({ ...baseEntry, schema: dereferenceSchema(propertySchema, rootSchema) }, false);
      }
    }

    for (const keyword of ["oneOf", "anyOf"] as const) {
      const branches = (resolved[keyword] ?? []) as JsonSchema[];
      branches.forEach((branch, index) => {
        if (!isSchemaObject(branch) || !schemaHasObjectShape(branch, rootSchema, nextRefs)) return;
        visit(branch, `${schemaPath}/${keyword}/${index}`, dataSegments, nextRefs);
      });
    }
  };

  visit(schema, "#", [], new Set());
  return [...entries.values()];
};

export const partitionSchemaEntries = (entries: SchemaEntry[]): PartitionedSchemaEntries => {
  const columnEntries: SchemaEntry[] = [];
  const arrayEntries: SchemaEntry[] = [];

  for (const entry of entries) {
    if (entry.schema.type === "array") arrayEntries.push(entry);
    else columnEntries.push(entry);
  }

  return { columnEntries, arrayEntries };
};

export const getValueAtPath = (row: unknown, segments: readonly string[]): unknown => {
  let value = row;

  for (const segment of segments) {
    if (value === null || typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[segment];
  }

  return value;
};

export const humanizePropertyName = (name: string): string => {
  const spaced = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

  return spaced ? spaced.replace(/\b\w/g, (letter) => letter.toUpperCase()) : name;
};

export const attachRootDefinitions = (schema: JsonSchema, rootSchema: JsonSchema): JsonSchema => ({
  ...schema,
  ...(rootSchema.definitions ? { definitions: rootSchema.definitions } : {}),
  ...((rootSchema as JsonSchema & { $defs?: Record<string, JsonSchema> }).$defs
    ? { $defs: (rootSchema as JsonSchema & { $defs?: Record<string, JsonSchema> }).$defs }
    : {}),
});
