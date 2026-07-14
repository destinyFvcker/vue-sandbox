<script setup lang="ts">
  import { demoPersonSchema, personColumnPaths } from "~/lib/datatable-example-schemas";
  import { createDemoPeople, formatCurrency } from "~/lib/datatable-examples";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Config } from "datatables.net";

  type Variant = "simple" | "no-horizontal" | "striped" | "vertical-lines";

  const props = defineProps<{
    variant: Variant;
  }>();

  const rows = createDemoPeople(5);
  const total = rows.reduce((sum, row) => sum + row.balance, 0);
  const tableClass = computed(() => {
    const classes = ["nowrap", "hover", `demo-${props.variant}`];
    if (props.variant === "vertical-lines") classes.push("cell-border");
    return classes.join(" ");
  });

  const options: Config = {
    dom: "t",
    ordering: false,
  };

  const columnOverrides: SchemaColumnOverrides = {
    id: { visible: false },
    balance: { className: "dt-body-right" },
  };
</script>

<template>
  <div class="overflow-hidden">
    <UiSchemaDatatable
      :class="tableClass"
      :schema="demoPersonSchema"
      :data="rows"
      :options="options"
      :column-overrides="columnOverrides"
      :column-paths="personColumnPaths.simple"
    >
      <template #cell-balance="{ cellData }">
        {{ formatCurrency(cellData as number) }}
      </template>
    </UiSchemaDatatable>
    <div class="flex items-center justify-between border-t px-4 py-5 text-sm md:px-6">
      <p class="text-muted-foreground">Total</p>
      <p class="font-semibold tabular-nums">{{ formatCurrency(total) }}</p>
    </div>
  </div>
</template>

<style scoped>
  :deep(table.dataTable.demo-no-horizontal td) {
    border-top-width: 0;
    border-bottom-width: 0;
  }

  :deep(table.dataTable.demo-striped td) {
    border-top-width: 0;
    border-bottom-width: 0;
  }

  :deep(table.dataTable.demo-striped tbody tr:nth-child(odd)) {
    background: color-mix(in oklab, var(--muted) 60%, transparent);
  }

  :deep(table.dataTable.demo-striped tbody tr:nth-child(odd) td:first-child) {
    border-radius: var(--radius) 0 0 var(--radius);
  }

  :deep(table.dataTable.demo-striped tbody tr:nth-child(odd) td:last-child) {
    border-radius: 0 var(--radius) var(--radius) 0;
  }

  :deep(table.dataTable.demo-vertical-lines thead th) {
    border-right: 1px solid var(--border);
  }

  :deep(table.dataTable.demo-vertical-lines thead th:first-child) {
    border-left: 1px solid var(--border);
  }
</style>
