import Badge from "@/components/Ui/Badge.vue";
import { createLabelDescriptionFrom, decode } from "@jsonforms/core";
import { ChevronRight } from "@lucide/vue";
import { createColumnHelper } from "@tanstack/vue-table";
import { collectSchemaEntries, partitionSchemaEntries } from "~/lib/schema-resolver";
import { startCase } from "lodash";
import type {
  ControlElement,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  JsonSchema7,
} from "@jsonforms/core";
import type { ColumnDef } from "@tanstack/vue-table";
import type { SchemaEntry } from "~/lib/schema-resolver";

import TableEmptyCell from "../Table/TableEmptyCell.vue";
import TableTipHeader from "../Table/TableTipHeader.vue";
import JsonCell from "./JsonCell.vue";

const dumpControlElement: ControlElement = {
  type: "Control",
  scope: "#",
};

const deriveLabel = (controlElement: ControlElement, schemaElement?: JsonSchema): string => {
  if (schemaElement && typeof schemaElement.title === "string") {
    return schemaElement.title;
  }
  if (typeof controlElement.scope === "string") {
    const ref = controlElement.scope;
    const label = decode(ref.substr(ref.lastIndexOf("/") + 1));
    return startCase(label);
  }

  return "";
};

const columnHelper = createColumnHelper<any>();

function getNestedValue(obj: any, path: string): unknown {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current == null) return undefined;
    current = current[key];
  }
  return current;
}

export interface GenColumnDefsResult {
  columns: ColumnDef<any, any>[];
  arrayEntries: SchemaEntry[];
}

export function genColumnDefs(
  schema: JsonSchema7,
  renderers: JsonFormsRendererRegistryEntry[]
): GenColumnDefsResult {
  const allEntries = collectSchemaEntries(schema);
  const { columnEntries, arrayEntries } = partitionSchemaEntries(allEntries);
  const rootDefinitions = (schema as any).definitions ?? (schema as any).$defs;

  const dataColumns: ColumnDef<any, any>[] = columnEntries.map((schemaEntry) => {
    return columnHelper.accessor((row) => getNestedValue(row, schemaEntry.dataPath), {
      id: schemaEntry.dataPath,
      header: () => {
        const header = deriveLabel(dumpControlElement, schemaEntry.schema);
        const { text: description } = createLabelDescriptionFrom(
          dumpControlElement,
          schemaEntry.schema
        );

        return h(TableTipHeader, {
          header: header ? header : schemaEntry.dataPath,
          description: description ? description : "No description available",
        });
      },
      cell: ({ getValue }) => {
        const cellValue = getValue();
        if (cellValue == null) {
          return h("div", { class: "relative" }, h(TableEmptyCell));
        }
        const cellSchema = rootDefinitions
          ? { ...schemaEntry.schema, definitions: rootDefinitions }
          : schemaEntry.schema;
        return h(
          "div",
          { class: "relative" },
          h(JsonCell, {
            data: cellValue,
            schema: cellSchema,
            renderers: renderers,
          })
        );
      },
    });
  });

  const columns: ColumnDef<any, any>[] = [];

  if (arrayEntries.length > 0) {
    columns.push(
      columnHelper.display({
        id: "__expand",
        header: () => "",
        cell: ({ row }) => {
          const badges = arrayEntries.map((entry) => {
            const val = getNestedValue(row.original, entry.dataPath);
            const count = Array.isArray(val) ? val.length : 0;
            return h(Badge, { variant: "secondary", class: "text-[10px] px-1.5 py-0" }, () => [
              h("span", { class: "text-muted-foreground" }, `${startCase(entry.dataPath)}: `),
              String(count),
            ]);
          });

          return h(
            "button",
            {
              class: "flex items-center gap-1.5 p-1 rounded hover:bg-muted cursor-pointer",
              onClick: () => row.toggleExpanded(),
            },
            [
              h(ChevronRight, {
                class: [
                  "size-4 shrink-0 transition-transform duration-200",
                  row.getIsExpanded() ? "rotate-90" : "",
                ],
              }),
              ...badges,
            ]
          );
        },
      })
    );
  }

  columns.push(...dataColumns);

  return { columns, arrayEntries };
}
