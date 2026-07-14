<script setup lang="ts">
  import { demoPersonSchema, personColumnPaths } from "~/lib/datatable-example-schemas";
  import { createDemoPeople, formatCurrency } from "~/lib/datatable-examples";
  import { createSelectRenderer } from "~/lib/datatables.client";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Config } from "datatables.net";

  type Variant = "row-selection" | "card" | "sticky-header";

  const props = defineProps<{
    variant: Variant;
  }>();

  const rows = createDemoPeople(props.variant === "sticky-header" ? 30 : 5);
  const total = rows.reduce((sum, row) => sum + row.balance, 0);
  const selectedCount = ref(0);
  const columnPaths = ["__select", ...personColumnPaths.simple] as const;

  const options: Config = {
    dom: "t",
    ordering: false,
    paging: false,
    scrollY: props.variant === "sticky-header" ? "300px" : undefined,
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
    id: { visible: false },
    balance: {
      className: "dt-body-right",
      render: (value: unknown, type: string) =>
        type === "display" ? formatCurrency(Number(value)) : value,
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
    <UiSchemaDatatable
      class="nowrap hover demo-selectable"
      :schema="demoPersonSchema"
      :data="rows"
      :column-paths="columnPaths"
      :column-overrides="columnOverrides"
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
