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

  const rows = createComplexStruct2Rows(40);
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
  <div class="bg-background overflow-hidden rounded-lg border">
    <div class="flex items-center justify-between border-b px-4 py-3 text-sm">
      <div>
        <p class="font-medium">Wide generated dataset</p>
        <p class="text-muted-foreground text-xs">横向滚动时固定复选框与 Foo Foo 列</p>
      </div>
      <p class="text-muted-foreground" data-testid="fixed-columns-selection">
        Selected {{ selectedCount }}
      </p>
    </div>
    <UiSchemaDatatable
      class="nowrap hover stripe row-border"
      :schema="selectableComplexStruct2Schema"
      :data="rows"
      :column-paths="complexStruct2ColumnPaths.selectableNested"
      :column-overrides="columnOverrides"
      :options="options"
    />
  </div>
</template>
