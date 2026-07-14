<script setup lang="ts">
  import { createDemoPeople, formatCurrency } from "~/lib/datatable-examples";
  import type { Config } from "datatables.net";

  const rows = createDemoPeople(36);

  const options: Config = {
    pageLength: 8,
    searchBuilder: true,
    buttons: ["copy", "csv", "excel", "print"],
    layout: {
      top1: "searchBuilder",
      topStart: "buttons",
      topEnd: "search",
      bottomStart: "info",
      bottomEnd: "paging",
    },
    columns: [
      { title: "Name", data: "name" },
      { title: "Department", data: "department" },
      { title: "Office", data: "office" },
      { title: "Status", data: "status" },
      {
        title: "Balance",
        data: "balance",
        className: "dt-body-right",
        render: (value: number) => formatCurrency(value),
      },
    ],
  };
</script>

<template>
  <div class="bg-background overflow-hidden rounded-lg border p-4">
    <UiDatatable class="nowrap hover stripe" :data="rows" :options="options" />
  </div>
</template>
