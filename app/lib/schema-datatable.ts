import type { SchemaEntry } from "./schema-resolver";
import type { JsonSchema } from "@jsonforms/core";
import type { Config, ConfigColumns } from "datatables.net";
import type { HTMLAttributes } from "vue";

import {
  attachRootDefinitions,
  collectSchemaEntries,
  getValueAtPath,
  humanizePropertyName,
  normalizeRowSchema,
  partitionSchemaEntries,
} from "./schema-resolver";

export type SchemaColumnOverride = Omit<Partial<ConfigColumns>, "data" | "name">;

export type SchemaColumnOverrides = Record<string, SchemaColumnOverride>;

export interface SchemaDatatableModel {
  rootSchema: JsonSchema;
  rowSchema: JsonSchema;
  columns: ConfigColumns[];
  columnEntries: SchemaEntry[];
}

export interface SchemaDatatablePublicOptions<T extends Record<string, any>> {
  schema: JsonSchema;
  data?: readonly T[];
  ajax?: Config["ajax"];
  options?: Config;
  class?: HTMLAttributes["class"];
  columnOverrides?: SchemaColumnOverrides;
  columnPaths?: readonly string[];
}

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!
  );

const serializeCompositeValue = (value: object): string => {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

/**
 * DataTables writes string display values through `innerHTML`. Escape only the
 * display channel while preserving primitive values for native search, sort,
 * and type detection.
 */
export const renderSchemaValue = (value: unknown, type: string): unknown => {
  if (value == null) return type === "display" ? "" : value;
  if (typeof value === "number" || typeof value === "boolean") return value;

  const text = typeof value === "string" ? value : serializeCompositeValue(value as object);
  return type === "display" ? escapeHtml(text) : text;
};

const requiresAccessor = (segments: readonly string[]): boolean =>
  segments.some((segment) => segment.length === 0 || /[.[\]\\()]/.test(segment));

const compileColumnData = (entry: SchemaEntry): ConfigColumns["data"] => {
  if (!requiresAccessor(entry.dataSegments)) return entry.dataSegments.join(".");
  const segments = [...entry.dataSegments];
  return (row: unknown) => getValueAtPath(row, segments);
};

const getOverride = (
  entry: SchemaEntry,
  overrides: SchemaColumnOverrides | undefined
): SchemaColumnOverride => overrides?.[entry.dataPath] ?? overrides?.[entry.schemaPath] ?? {};

export const buildSchemaDatatableModel = (
  schema: JsonSchema,
  overrides?: SchemaColumnOverrides,
  columnPaths?: readonly string[]
): SchemaDatatableModel => {
  const { rootSchema, rowSchema } = normalizeRowSchema(schema);
  const allEntries = collectSchemaEntries(rowSchema, rootSchema);
  const { columnEntries: scalarEntries } = partitionSchemaEntries(allEntries);
  let columnEntries = scalarEntries;

  if (columnPaths) {
    const entriesByPath = new Map<string, SchemaEntry>();
    for (const entry of allEntries) {
      entriesByPath.set(entry.dataPath, entry);
      entriesByPath.set(entry.schemaPath, entry);
    }

    columnEntries = columnPaths.map((path) => {
      const entry = entriesByPath.get(path);
      if (!entry) throw new Error(`[UiSchemaDatatable] Unknown column path: ${path}`);
      return entry;
    });
  }

  const columns: ConfigColumns[] = columnEntries.map((entry) => {
    const title = escapeHtml(
      typeof entry.schema.title === "string"
        ? entry.schema.title
        : humanizePropertyName(entry.dataSegments.at(-1) ?? entry.dataPath)
    );
    const override = getOverride(entry, overrides);
    const { render: customRender, ...columnOptions } = override;

    return {
      title,
      defaultContent: "",
      render: customRender ?? renderSchemaValue,
      ...columnOptions,
      data: compileColumnData(entry),
      name: entry.dataPath,
    };
  });

  return {
    rootSchema,
    rowSchema: attachRootDefinitions(rowSchema, rootSchema),
    columns,
    columnEntries,
  };
};
