<script setup lang="ts">
  import { createColumnHelper } from "@tanstack/vue-table";
  import { startCase } from "lodash-es";
  import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core";
  import type { ColumnDef } from "@tanstack/vue-table";
  import type { SchemaEntry } from "~/lib/schema-resolver";

  import { genColumnDefs } from "../Renderer/genColumnDef";

  const props = defineProps<{
    data: any[];
    columns: ColumnDef<any, any>[];
    arrayEntries?: SchemaEntry[];
    renderers?: JsonFormsRendererRegistryEntry[];
    isLoading?: boolean;
    innerScoll?: boolean;
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

  const { height: windowHeight } = useWindowSize();
</script>

<template>
  <UiTanStackTable
    :data="data"
    :columns="columns"
    :initial-page-size="30"
    :page-size-options="[30, 50, 100, 200, 300]"
    :pagination="true"
    :inner-scroll="innerScoll"
    :loading="isLoading"
    :inner-scroll-height="windowHeight"
    :inner-scroll-header-sticky="true"
    :keep-pinned="true"
  >
    <template v-if="arrayEntries && arrayEntries.length > 0" #expanded-row="{ row }">
      <div class="bg-muted/30 border-t p-2">
        <UiTabs :default-value="arrayEntries[0]!.dataPath">
          <UiTabsList>
            <UiTabsTrigger
              v-for="entry in arrayEntries"
              :key="entry.dataPath"
              :value="entry.dataPath"
              class="px-2 py-0.5"
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
