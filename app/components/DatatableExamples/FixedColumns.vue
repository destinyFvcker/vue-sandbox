<script setup lang="ts">
  import { createDemoPeople, formatCurrency } from "~/lib/datatable-examples";
  import DataTablesCore from "datatables.net";
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
    columns: [
      {
        data: null,
        searchable: false,
        orderable: false,
        render: DataTablesCore.render.select(),
      },
      { title: "Name", data: "name" },
      { title: "Email", data: "email" },
      { title: "Position", data: "position" },
      { title: "Office", data: "office" },
      { title: "Age", data: "age", className: "dt-body-right" },
      { title: "Start date", data: "startDate" },
      { title: "Department", data: "department" },
      { title: "Status", data: "status" },
      {
        title: "Balance",
        data: "balance",
        className: "dt-body-right",
        render: (value: number) => formatCurrency(value),
      },
      { title: "Phone", data: "phone" },
    ],
    on: {
      select: (_event, table) => {
        selectedCount.value = table.rows({ selected: true }).count();
      },
      deselect: (_event, table) => {
        selectedCount.value = table.rows({ selected: true }).count();
      },
    },
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
    <UiDatatable class="nowrap hover stripe row-border" :data="rows" :options="options" />
  </div>
</template>
