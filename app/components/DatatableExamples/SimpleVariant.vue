<script setup lang="ts">
  import { complexStruct2ColumnPaths, complexStruct2Schema } from "~/lib/datatable-example-schemas";
  import { formatNumber } from "~/lib/datatable-examples";
  import { createComplexStruct2Rows } from "~/lib/generated-mocks";
  import type { SchemaColumnOverrides } from "~/lib/dt-schema-datatable";
  import type { Config } from "datatables.net";

  type Variant = "simple" | "no-horizontal" | "striped" | "vertical-lines";

  const props = defineProps<{
    variant: Variant;
  }>();

  const rows = createComplexStruct2Rows(5);
  const total = rows.reduce((sum, row) => sum + row.nested_field.foo.foo_foo, 0);
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
    "nested_field.foo.foo_foo": {
      className: "dt-body-right",
      render: (value: unknown, type: string) =>
        type === "display" ? formatNumber(Number(value)) : value,
    },
  };
</script>

<template>
  <div class="overflow-hidden">
    <UiSchemaDatatable
      :class="tableClass"
      :schema="complexStruct2Schema"
      :data="rows"
      :options="options"
      :column-overrides="columnOverrides"
      :column-paths="complexStruct2ColumnPaths.compact"
    />
    <div class="flex items-center justify-between border-t px-4 py-5 text-sm md:px-6">
      <p class="text-muted-foreground">Total</p>
      <p class="font-semibold tabular-nums">{{ formatNumber(total) }}</p>
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
