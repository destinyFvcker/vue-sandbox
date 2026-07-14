<script setup lang="ts">
  import { createDemoPeople, formatCurrency } from "~/lib/datatable-examples";
  import type { Config } from "datatables.net";

  // Keep this data set client-side to compare the raw Vue DataTables adapter
  // with the schema-driven wrapper under the same SearchBuilder workload.
  const rows = createDemoPeople(100_000);

  const options: Config = {
    pageLength: 2_000,
    lengthMenu: [100, 250, 500, 1_000, 2_000],
    searchBuilder: true,
    buttons: ["copy", "csv", "excel", "print"],
    layout: {
      top1: "searchBuilder",
      topStart: ["pageLength", "buttons"],
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
