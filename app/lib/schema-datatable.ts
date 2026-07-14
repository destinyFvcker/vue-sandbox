import type { SchemaEntry } from "./schema-resolver";
import type { createAjv, JsonFormsRendererRegistryEntry, JsonSchema } from "@jsonforms/core";
import type { Config, ConfigColumns } from "datatables.net";

import {
  attachRootDefinitions,
  collectSchemaEntries,
  getValueAtPath,
  humanizePropertyName,
  normalizeRowSchema,
  partitionSchemaEntries,
} from "./schema-resolver";

export const SCHEMA_CELL_SLOT = "#schema-cell";
export const SCHEMA_EXPAND_SLOT = "#schema-expand";

export const getSchemaCellSlot = (entryIndex: number) => `${SCHEMA_CELL_SLOT}-${entryIndex}`;

export type SchemaColumnOverride = Omit<Partial<ConfigColumns>, "data" | "name">;

export type SchemaColumnOverrides = Record<string, SchemaColumnOverride>;

export type SchemaCellSlots = Record<string, string>;

export type SchemaDatatableAjv = ReturnType<typeof createAjv>;

export interface SchemaDatatableModel {
  rootSchema: JsonSchema;
  rowSchema: JsonSchema;
  columns: ConfigColumns[];
  columnEntries: SchemaEntry[];
  arrayEntries: SchemaEntry[];
}

export interface SchemaDatatablePublicOptions<T extends Record<string, unknown>> {
  schema: JsonSchema;
  data?: readonly T[];
  ajax?: Config["ajax"];
  options?: Config;
  renderers?: readonly JsonFormsRendererRegistryEntry[];
  columnOverrides?: SchemaColumnOverrides;
  columnPaths?: readonly string[];
  cellSlots?: SchemaCellSlots;
}

const displayValue = (value: unknown): string | number => {
  if (value == null) return "";
  if (typeof value === "number" || typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const sortValue = (value: unknown): string | number => {
  if (value == null) return "";
  if (typeof value === "number" || typeof value === "string") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  return displayValue(value);
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
  const partitionedEntries = partitionSchemaEntries(allEntries);
  let columnEntries = partitionedEntries.columnEntries;
  let arrayEntries = partitionedEntries.arrayEntries;

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

    const projectedEntries = new Set(columnEntries);
    arrayEntries = partitionedEntries.arrayEntries.filter((entry) => !projectedEntries.has(entry));
  }

  const columns: ConfigColumns[] = columnEntries.map((entry, entryIndex) => {
    const readValue = (_data: unknown, _type: string, row: unknown) =>
      getValueAtPath(row, entry.dataSegments);
    const title =
      typeof entry.schema.title === "string"
        ? entry.schema.title
        : humanizePropertyName(entry.dataSegments.at(-1) ?? entry.dataPath);

    const override = getOverride(entry, overrides);
    const { render: customRender, ...columnOptions } = override;
    const schemaRender: ConfigColumns["render"] = {
      _: (_data: unknown, _type: string, row: unknown) => displayValue(readValue(null, "", row)),
      display: getSchemaCellSlot(entryIndex),
      filter: (_data: unknown, _type: string, row: unknown) =>
        displayValue(readValue(null, "", row)),
      sort: (_data: unknown, _type: string, row: unknown) => sortValue(readValue(null, "", row)),
      type: (_data: unknown, _type: string, row: unknown) => sortValue(readValue(null, "", row)),
    };

    return {
      title,
      defaultContent: "",
      ...columnOptions,
      data: null,
      name: entry.dataPath,
      render: customRender ?? schemaRender,
    };
  });

  if (arrayEntries.length > 0) {
    columns.unshift({
      className: "schema-datatable-control",
      data: null,
      defaultContent: "",
      name: "__schema_details",
      orderable: false,
      searchable: false,
      title: "",
      width: "1%",
      render: {
        _: () => "",
        display: SCHEMA_EXPAND_SLOT,
        filter: () => "",
        sort: () => "",
        type: () => "",
      },
    });
  }

  return {
    rootSchema,
    rowSchema: attachRootDefinitions(rowSchema, rootSchema),
    columns,
    columnEntries,
    arrayEntries,
  };
};
