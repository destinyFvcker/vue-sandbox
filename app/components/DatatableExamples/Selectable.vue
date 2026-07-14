<script setup lang="ts">
  import DataTablesCore from "datatables.net";
  import type { Config } from "datatables.net";

  import "datatables.net-select-dt";

  import { createDemoPeople, formatCurrency } from "~/lib/datatable-examples";

  type Variant = "row-selection" | "card" | "sticky-header";

  const props = defineProps<{
    variant: Variant;
  }>();

  const rows = createDemoPeople(props.variant === "sticky-header" ? 30 : 5);
  const total = rows.reduce((sum, row) => sum + row.balance, 0);
  const selectedCount = ref(0);

  const options: Config = {
    dom: "t",
    ordering: false,
    paging: false,
    scrollY: props.variant === "sticky-header" ? "300px" : undefined,
    columns: [
      {
        data: null,
        searchable: false,
        orderable: false,
        render: DataTablesCore.render.select(),
      },
      { title: "ID", data: "id", visible: false },
      { title: "Name", data: "name" },
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
</script>

<template>
  <div
    :class="[
      variant === 'card' || variant === 'sticky-header'
        ? 'bg-background overflow-hidden rounded-lg border'
        : '',
    ]"
  >
    <div v-if="selectedCount" class="bg-primary/5 border-b px-4 py-2 text-sm font-medium">
      已选择 {{ selectedCount }} 行
    </div>
    <UiDatatable
      class="nowrap hover demo-selectable"
      :data="rows"
      :options="options"
      data-testid="selectable-table"
    />
    <div class="flex items-center justify-between border-t px-4 py-5 text-sm md:px-6">
      <p class="text-muted-foreground">Total</p>
      <p class="font-semibold tabular-nums">{{ formatCurrency(total) }}</p>
    </div>
  </div>
</template>

<style scoped>
  :deep(.dataTable .dt-select-checkbox) {
    width: 18px;
    height: 18px;
    cursor: pointer;
    border-radius: 0.25rem;
  }

  :deep(.dt-scroll-body table thead tr) {
    visibility: collapse;
  }
</style>
