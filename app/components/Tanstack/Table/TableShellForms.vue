<script setup lang="ts">
  import { createColumnHelper } from "@tanstack/vue-table";
  import { startCase } from "lodash-es";
  import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core";
  import type { ColumnDef, Table } from "@tanstack/vue-table";
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
  const tableRef = useTemplateRef("tableRef");
  const table = ref<Table<any> | null>(null);

  function exportCsv(mode: "all" | "page") {
    if (!table.value) return;

    // Get rows based on mode
    const rows =
      mode === "all" ? table.value.getFilteredRowModel().rows : table.value.getRowModel().rows;

    if (!rows.length) {
      useSonner.info("No data to export", {
        description: "Please ensure there is data to export.",
      });
      return;
    }

    // Get visible columns, excluding actions
    const columns = table.value.getVisibleLeafColumns().filter((col) => col.id !== "actions");

    // Build header row
    const header = columns.map((col) => {
      const headerText = typeof col.columnDef.header === "string" ? col.columnDef.header : col.id;
      return escapeCsvValue(String(headerText));
    });

    // Build data rows
    const dataRows = rows.map((row) =>
      columns.map((col) => {
        const value = row.getValue(col.id);
        return escapeCsvValue(value);
      })
    );

    // Combine and create CSV
    const csv = [header, ...dataRows].map((r) => r.join(",")).join("\n");

    // Create blob and trigger download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payments-${mode === "all" ? "all" : "page"}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    useSonner.success("Export successful", {
      description: `${rows.length} row(s) exported to CSV.`,
    });
  }

  function escapeCsvValue(value: any): string {
    if (value == null) return '""';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  }
</script>

<template>
  <div class="flex flex-col justify-between gap-5 md:flex-row md:items-center">
    <UiInput
      v-if="tableRef"
      v-model="tableRef!.globalFilter"
      type="search"
      placeholder="Search"
      class="w-full md:w-96"
    />
    <div class="flex flex-col gap-x-3 gap-y-5 md:flex-row">
      <UiDropdownMenu>
        <UiDropdownMenuTrigger as-child>
          <UiButton variant="outline">
            <span>Download</span>
            <Icon name="lucide:cloud-download" class="size-4" />
          </UiButton>
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent :side-offset="10" align="start">
          <UiDropdownMenuLabel> Export Data </UiDropdownMenuLabel>
          <UiDropdownMenuSeparator />
          <UiDropdownMenuItem
            title="Export All"
            icon="lucide:file-spreadsheet"
            @select="exportCsv('all')"
          />
          <UiDropdownMenuItem
            title="Export Current Page"
            icon="lucide:file-spreadsheet"
            @select="exportCsv('page')"
          />
        </UiDropdownMenuContent>
      </UiDropdownMenu>
      <UiDropdownMenu>
        <UiDropdownMenuTrigger as-child>
          <UiButton variant="outline">
            <span>View</span>
            <Icon name="lucide:chevron-down" class="size-4" />
          </UiButton>
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent :side-offset="10" align="start" class="w-75 md:w-50">
          <UiDropdownMenuLabel> Toggle Columns </UiDropdownMenuLabel>
          <UiDropdownMenuSeparator />
          <UiDropdownMenuGroup>
            <UiDropdownMenuCheckboxItem
              v-for="column in table
                ?.getAllColumns()
                .filter((column: { getCanHide: () => any }) => column.getCanHide())"
              :key="column.id"
              :model-value="column.getIsVisible()"
              @update:model-value="column.toggleVisibility()"
            >
              <span class="text-sm capitalize">{{ column?.id }}</span>
            </UiDropdownMenuCheckboxItem>
          </UiDropdownMenuGroup>
        </UiDropdownMenuContent>
      </UiDropdownMenu>
    </div>
  </div>

  <UiTanStackTable
    ref="tableRef"
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
    @ready="table = $event"
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
