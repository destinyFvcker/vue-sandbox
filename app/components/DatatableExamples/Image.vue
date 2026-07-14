<script setup lang="ts">
  import { createDemoPeople, formatCurrency } from "~/lib/datatable-examples";
  import type { DataTablesNamedSlotProps } from "~/components/Ui/Datatable.client.vue";
  import type { DemoPerson } from "~/lib/datatable-examples";
  import type { Config } from "datatables.net";

  const rows = createDemoPeople(5);
  const total = rows.reduce((sum, row) => sum + row.balance, 0);

  const options: Config = {
    dom: "t",
    ordering: false,
    columns: [
      { title: "ID", data: "id", visible: false },
      {
        title: "Name",
        data: null,
        render: {
          _: "name",
          display: "#person",
        },
      },
      { title: "Email", data: "email" },
      { title: "Location", data: "location.city" },
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
  <div class="overflow-hidden">
    <UiDatatable class="nowrap hover row-border" :data="rows" :options="options">
      <template #person="{ rowData }">
        <div class="flex items-center gap-3">
          <img
            :alt="(rowData as DataTablesNamedSlotProps<DemoPerson>['rowData']).name"
            class="size-10 rounded-full object-cover"
            :src="(rowData as DemoPerson).image"
          />
          <div>
            <p class="font-medium">{{ (rowData as DemoPerson).name }}</p>
            <p class="text-muted-foreground text-xs">@{{ (rowData as DemoPerson).username }}</p>
          </div>
        </div>
      </template>
    </UiDatatable>
    <div class="flex items-center justify-between border-t px-4 py-5 text-sm md:px-6">
      <p class="text-muted-foreground">Total</p>
      <p class="font-semibold tabular-nums">{{ formatCurrency(total) }}</p>
    </div>
  </div>
</template>
