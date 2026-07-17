<script setup lang="ts">
  import { complexStruct2ColumnPaths, complexStruct2Schema } from "~/lib/datatable-example-schemas";
  import { formatNumber } from "~/lib/datatable-examples";
  import { createComplexStruct2Rows } from "~/lib/generated-mocks";
  import type { SchemaColumnOverrides } from "~/lib/dt-schema-datatable";
  import type { Config } from "datatables.net";

  const startedAt = globalThis.performance.now();
  const rows = createComplexStruct2Rows(100_000);
  const ready = ref(false);
  const readyMs = ref(0);

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
  };

  const columnOverrides: SchemaColumnOverrides = {
    "nested_field.foo.foo_foo": {
      className: "dt-body-right",
      render: (value: unknown, type: string) =>
        type === "display" ? formatNumber(Number(value)) : value,
    },
  };

  const onReady = () => {
    readyMs.value = globalThis.performance.now() - startedAt;
    ready.value = true;
  };
</script>

<template>
  <div
    class="bg-background overflow-hidden rounded-lg border p-4"
    data-testid="schema-performance"
    :data-ready="ready"
    :data-ready-ms="readyMs.toFixed(2)"
  >
    <UiSchemaDatatable
      class="nowrap hover stripe"
      :schema="complexStruct2Schema"
      :data="rows"
      :options="options"
      :column-paths="complexStruct2ColumnPaths.compact"
      :column-overrides="columnOverrides"
      @ready="onReady"
    />
  </div>
</template>
