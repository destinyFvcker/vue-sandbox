<script setup lang="ts">
  import { demoPersonSchema, personColumnPaths } from "~/lib/datatable-example-schemas";
  import { createDemoPeople, formatCurrency } from "~/lib/datatable-examples";
  import { createSelectRenderer } from "~/lib/datatables.client";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Config } from "datatables.net";

  const rows = createDemoPeople(40);
  const selectedCount = ref(0);

  const options: Config = {
    dom: "<'flex items-center justify-between gap-3 border-b p-4'f><'overflow-hidden't><'flex flex-col gap-3 border-t p-4 text-sm sm:flex-row sm:items-center sm:justify-between'ip>",
    pageLength: 12,
    scrollX: true,
    scrollY: "360px",
    scrollCollapse: true,
    fixedColumns: {
      start: 2,
    },
    select: {
      style: "multi",
      selector: "td:first-child",
    },
    on: {
      select: (_event, table) => {
        selectedCount.value = table.rows({ selected: true }).count();
      },
      deselect: (_event, table) => {
        selectedCount.value = table.rows({ selected: true }).count();
      },
    },
  };

  const columnOverrides: SchemaColumnOverrides = {
    __select: {
      searchable: false,
      orderable: false,
      render: createSelectRenderer(),
    },
    age: { className: "dt-body-right" },
    balance: { className: "dt-body-right" },
  };
</script>

<template>
  <div class="bg-background overflow-hidden rounded-lg border">
    <div class="flex items-center justify-between border-b px-4 py-3 text-sm">
      <div>
        <p class="font-medium">Wide employee dataset</p>
        <p class="text-muted-foreground text-xs">横向滚动时固定复选框与 Name 列</p>
      </div>
      <p class="text-muted-foreground" data-testid="fixed-columns-selection">
        Selected {{ selectedCount }}
      </p>
    </div>
    <UiSchemaDatatable
      class="nowrap hover stripe row-border"
      :schema="demoPersonSchema"
      :data="rows"
      :column-paths="personColumnPaths.fixedColumns"
      :column-overrides="columnOverrides"
      :options="options"
    >
      <template #cell-status="{ cellData }">
        {{ cellData }}
      </template>
      <template #cell-balance="{ cellData }">
        {{ formatCurrency(Number(cellData)) }}
      </template>
    </UiSchemaDatatable>
  </div>
</template>
