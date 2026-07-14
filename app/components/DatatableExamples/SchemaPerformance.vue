<script setup lang="ts">
  import { demoPersonSchema, personColumnPaths } from "~/lib/datatable-example-schemas";
  import { createDemoPeople, formatCurrency } from "~/lib/datatable-examples";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Config } from "datatables.net";

  const startedAt = globalThis.performance.now();
  const rows = createDemoPeople(100_000);
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
    balance: {
      className: "dt-body-right",
      render: (value: unknown, type: string) =>
        type === "display" ? formatCurrency(Number(value)) : value,
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
      :schema="demoPersonSchema"
      :data="rows"
      :options="options"
      :column-paths="personColumnPaths.layout"
      :column-overrides="columnOverrides"
      @ready="onReady"
    />
  </div>
</template>
