<script setup lang="ts">
  import {
    complexStruct2ColumnPaths,
    selectableComplexStruct2Schema,
  } from "~/lib/datatable-example-schemas";
  import { formatNumber } from "~/lib/datatable-examples";
  import { createSelectRenderer } from "~/lib/datatables.client";
  import { createComplexStruct2Rows } from "~/lib/generated-mocks";
  import type { SchemaColumnOverrides } from "~/lib/dt-schema-datatable";
  import type { Config } from "datatables.net";

  type Variant = "row-selection" | "card" | "sticky-header";

  const props = defineProps<{
    variant: Variant;
  }>();

  const rows = createComplexStruct2Rows(props.variant === "sticky-header" ? 30 : 5);
  const total = rows.reduce((sum, row) => sum + row.nested_field.foo.foo_foo, 0);
  const selectedCount = ref(0);

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
    "nested_field.foo.foo_foo": {
      className: "dt-body-right",
      render: (value: unknown, type: string) =>
        type === "display" ? formatNumber(Number(value)) : value,
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
      :schema="selectableComplexStruct2Schema"
      :data="rows"
      :column-paths="complexStruct2ColumnPaths.selectable"
      :column-overrides="columnOverrides"
      :options="options"
      data-testid="selectable-table"
    />
    <div class="flex items-center justify-between border-t px-4 py-5 text-sm md:px-6">
      <p class="text-muted-foreground">Total</p>
      <p class="font-semibold tabular-nums">{{ formatNumber(total) }}</p>
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
</style>
