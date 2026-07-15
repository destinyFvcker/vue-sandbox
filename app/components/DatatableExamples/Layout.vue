<script setup lang="ts">
  import { complexStruct2ColumnPaths, complexStruct2Schema } from "~/lib/datatable-example-schemas";
  import { formatNumber } from "~/lib/datatable-examples";
  import { createComplexStruct2Rows } from "~/lib/generated-mocks";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Config } from "datatables.net";

  const rows = createComplexStruct2Rows(10_000);

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
  <div class="bg-background overflow-hidden rounded-lg border p-4">
    <UiSchemaDatatable
      class="nowrap hover stripe"
      :schema="complexStruct2Schema"
      :data="rows"
      :options="options"
      :column-overrides="columnOverrides"
      :column-paths="complexStruct2ColumnPaths.compact"
    />
  </div>
</template>
