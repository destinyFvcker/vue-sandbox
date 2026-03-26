<script setup lang="ts">
  import { createColumnHelper } from "@tanstack/vue-table";
  import { startCase } from "lodash-es";
  import { genColumnDefs } from "../Renderer/genColumnDef";
  import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core";
  import type { ColumnDef } from "@tanstack/vue-table";
  import type { SchemaEntry } from "~/lib/schema-resolver";

  const props = defineProps<{
    data: any[];
    columns: ColumnDef<any, any>[];
    arrayEntries?: SchemaEntry[];
    renderers?: JsonFormsRendererRegistryEntry[];
  }>();

  function getNestedValue(obj: any, path: string): unknown {
    const keys = path.split(".");
    let current = obj;
    for (const key of keys) {
      if (current == null) return undefined;
      current = current[key];
    }
    return current;
  }

  function getSubTableColumns(entry: SchemaEntry) {
    const itemsSchema = entry.schema.items;
    if (
      itemsSchema &&
      typeof itemsSchema === "object" &&
      !Array.isArray(itemsSchema) &&
      (itemsSchema as any).properties
    ) {
      return genColumnDefs(itemsSchema as any, props.renderers ?? []).columns;
    }
    const helper = createColumnHelper<any>();
    return [
      helper.accessor((row: any) => row, {
        id: "value",
        header: () => startCase(entry.dataPath),
        cell: ({ getValue }: any) => String(getValue()),
      }),
    ];
  }

  function getSubTableData(rowData: any, entry: SchemaEntry): any[] {
    const value = getNestedValue(rowData, entry.dataPath);
    if (!Array.isArray(value)) return [];
    return value;
  }
</script>

<template>
  <UiTanStackTable :data="data" :columns="columns" :show-footer="false">
    <template v-if="arrayEntries && arrayEntries.length > 0" #expanded-row="{ row }">
      <div class="bg-muted/30 max-h-75 overflow-auto border-t p-3">
        <UiTabs :default-value="arrayEntries[0]!.dataPath">
          <UiTabsList>
            <UiTabsTrigger
              v-for="entry in arrayEntries"
              :key="entry.dataPath"
              :value="entry.dataPath"
            >
              {{ startCase(entry.dataPath) }}
            </UiTabsTrigger>
          </UiTabsList>
          <UiTabsContent
            v-for="entry in arrayEntries"
            :key="entry.dataPath"
            :value="entry.dataPath"
          >
            <UiTanStackTable
              :data="getSubTableData(row.original, entry)"
              :columns="getSubTableColumns(entry)"
              :show-footer="false"
              class="text-xs"
            />
          </UiTabsContent>
        </UiTabs>
      </div>
    </template>
  </UiTanStackTable>
</template>
