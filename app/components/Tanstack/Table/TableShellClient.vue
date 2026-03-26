<script setup lang="ts" generic="TData">
  import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "@lucide/vue";
  import {
    createColumnHelper,
    FlexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useVueTable,
  } from "@tanstack/vue-table";
  import { cn } from "~/lib/utils";
  import { startCase } from "lodash";
  import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core";
  import type { ColumnDef, ColumnSort, ExpandedState, SortingState } from "@tanstack/vue-table";
  import type { SchemaEntry } from "~/lib/schema-resolver";
  import type { HTMLAttributes } from "vue";

  import { genColumnDefs } from "../Renderer/genColumnDef";

  interface Props {
    data: TData[];
    columns: ColumnDef<TData, any>[];
    arrayEntries?: SchemaEntry[];
    renderers?: JsonFormsRendererRegistryEntry[];
    paginator?: boolean;
    paginSiblingCnt?: number;
    paginatorPosition?: "center" | "start" | "end";
    initSort?: ColumnSort;
    class?: HTMLAttributes["class"];
  }

  const {
    data,
    columns,
    arrayEntries = [],
    renderers = [],
    paginator = false,
    paginatorPosition = "center",
    paginSiblingCnt = 4,
    initSort = null,
    class: className,
  } = defineProps<Props>();

  const sorting = ref<SortingState>(initSort ? [initSort] : []);
  const expanded = ref<ExpandedState>({});
  const paginParam = ref({
    pageIndex: 1,
    pageSize: 100,
  });

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
      return genColumnDefs(itemsSchema as any, renderers).columns;
    }
    // Primitive array: single "Value" column
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
    const itemsSchema = entry.schema.items;
    if (
      itemsSchema &&
      typeof itemsSchema === "object" &&
      !Array.isArray(itemsSchema) &&
      (itemsSchema as any).properties
    ) {
      return value;
    }
    // Primitive array: wrap each item for the single-column table
    return value;
  }

  const table = useVueTable({
    get data() {
      return data;
    },
    get columns() {
      return columns;
    },
    state: {
      get sorting() {
        return sorting.value;
      },
      get expanded() {
        return expanded.value;
      },
      get pagination() {
        return {
          pageIndex: paginParam.value.pageIndex - 1,
          pageSize: paginParam.value.pageSize,
        };
      },
    },
    onSortingChange: (updaterOrValue) => {
      sorting.value =
        typeof updaterOrValue === "function" ? updaterOrValue(sorting.value) : updaterOrValue;
    },
    onExpandedChange: (updaterOrValue) => {
      expanded.value =
        typeof updaterOrValue === "function" ? updaterOrValue(expanded.value) : updaterOrValue;
    },
    onPaginationChange: (updaterOrValue) => {
      const newVal =
        typeof updaterOrValue === "function" ? updaterOrValue(paginParam.value) : updaterOrValue;
      paginParam.value = {
        pageIndex: newVal.pageIndex + 1,
        pageSize: newVal.pageSize,
      };
    },
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
</script>

<template>
  <!-- <TanstackTablePaginator
    v-if="paginator"
    :model-value="paginParam"
    :total-cnt="data.length"
    :sibling-cnt="paginSiblingCnt"
    :position="paginatorPosition"
  /> -->
  <!-- <div :class="cn('relative rounded-md border', className)"> -->
  <UiTable :dClass="cn('relative rounded-md border', className)">
    <UiTableHeader class="bg-muted [&_th]:bg-muted">
      <UiTableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
        <UiTableHead v-for="header in headerGroup.headers" :key="header.id">
          <button
            class="group flex w-full cursor-pointer items-center justify-center gap-1 rounded-sm px-0 transition select-none hover:bg-slate-500 hover:text-white"
            @click="header.column.getToggleSortingHandler()?.($event)"
            :disabled="!header.column.getCanSort()"
          >
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />

            <ArrowUpNarrowWide
              v-if="header.column.getIsSorted().toString() === 'asc'"
              class="size-4 text-blue-700 group-hover:text-white"
            />
            <ArrowDownWideNarrow
              v-else-if="header.column.getIsSorted().toString() === 'desc'"
              class="size-4 text-blue-700 group-hover:text-white"
            />
          </button>
        </UiTableHead>
      </UiTableRow>
    </UiTableHeader>
    <UiTableBody>
      <template v-if="table.getRowModel().rows?.length">
        <template v-for="row in table.getRowModel().rows" :key="row.id">
          <UiTableRow :data-state="row.getIsSelected() ? 'selected' : undefined">
            <UiTableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </UiTableCell>
          </UiTableRow>
          <UiTableRow v-if="row.getIsExpanded() && arrayEntries.length > 0">
            <UiTableCell :colspan="columns.length" class="p-0">
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
                    <TableShellClient
                      :data="getSubTableData(row.original, entry)"
                      :columns="getSubTableColumns(entry)"
                      :renderers="renderers"
                      class="text-xs"
                    />
                  </UiTabsContent>
                </UiTabs>
              </div>
            </UiTableCell>
          </UiTableRow>
        </template>
      </template>
      <template v-else>
        <UiTableRow>
          <UiTableCell :colspan="columns.length" class="h-24 text-center">
            No results.
          </UiTableCell>
        </UiTableRow>
      </template>
    </UiTableBody>
  </UiTable>
  <!-- </div> -->
</template>
