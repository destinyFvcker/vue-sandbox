<script setup lang="ts">
  import {
    complexStruct2ColumnPaths,
    selectableComplexStruct2Schema,
  } from "~/lib/datatable-example-schemas";
  import { formatNumber } from "~/lib/datatable-examples";
  import { createSelectRenderer } from "~/lib/datatables.client";
  import { createComplexStruct2Rows } from "~/lib/generated-mocks";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Config } from "datatables.net";

  const rows = createComplexStruct2Rows(100);
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
      <p class="font-medium">DOM layout controls</p>
      <p class="text-muted-foreground" data-testid="dom-selection">Selected {{ selectedCount }}</p>
    </div>
    <UiSchemaDatatable
      class="nowrap hover stripe order-column"
      :schema="selectableComplexStruct2Schema"
      :data="rows"
      :column-paths="complexStruct2ColumnPaths.selectableNested"
      :column-overrides="columnOverrides"
      :options="options"
    />
  </div>
</template>
