<script setup lang="ts">
  import DataTablesCore from "datatables.net";
  import type { Config } from "datatables.net";

  import "datatables.net-select-dt";

  import { createDemoPeople, formatCurrency } from "~/lib/datatable-examples";

  const rows = createDemoPeople(100);
  const selectedCount = ref(0);

  const options: Config = {
    dom: "<'flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between'Bf><'overflow-auto't><'flex flex-col gap-3 border-t p-4 text-sm md:flex-row md:items-center md:justify-between'lip>",
    pageLength: 8,
    lengthMenu: [8, 16, 32, 64],
    responsive: true,
    select: {
      style: "multi",
      selector: "td:first-child",
    },
    buttons: [
      "copy",
      "csv",
      "excel",
      "print",
      {
        text: "Select all",
        action: (_event, table) => {
          table.rows({ search: "applied" }).select();
          selectedCount.value = table.rows({ selected: true }).count();
        },
      },
    ],
    columns: [
      {
        data: null,
        searchable: false,
        orderable: false,
        render: DataTablesCore.render.select(),
      },
      { title: "ID", data: "id", visible: false },
      { title: "Name", data: "name" },
      { title: "Position", data: "position" },
      { title: "Office", data: "office" },
      { title: "Age", data: "age", className: "dt-body-right" },
      { title: "Start date", data: "startDate" },
      {
        title: "Balance",
        data: "balance",
        className: "dt-body-right",
        render: (value: number) => formatCurrency(value),
      },
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
      <p class="font-medium">DOM layout controls</p>
      <p class="text-muted-foreground" data-testid="dom-selection">Selected {{ selectedCount }}</p>
    </div>
    <UiDatatable class="nowrap hover stripe order-column" :data="rows" :options="options" />
  </div>
</template>
