<script setup lang="ts">
  import { formatNumber } from "~/lib/datatable-examples";
  import { createComplexStruct2Rows } from "~/lib/generated-mocks";
  import type { Config } from "datatables.net";

  // Keep this data set client-side to compare the raw Vue DataTables adapter
  // with the schema-driven wrapper under the same SearchBuilder workload.
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
    columns: [
      {
        title: "Foo Foo",
        data: "nested_field.foo.foo_foo",
        className: "dt-body-right",
        render: (value: number, type: string) => (type === "display" ? formatNumber(value) : value),
      },
      { title: "Foo Bar", data: "nested_field.foo.foo_bar" },
      { title: "Foo Qux", data: "nested_field.foo.foo_qux" },
      {
        title: "Normal Enum",
        data: "normal_enum",
      },
    ],
  };

  const onReady = () => {
    readyMs.value = globalThis.performance.now() - startedAt;
    ready.value = true;
  };
</script>

<template>
  <div
    class="bg-background overflow-hidden rounded-lg border p-4"
    data-testid="raw-performance"
    :data-ready="ready"
    :data-ready-ms="readyMs.toFixed(2)"
  >
    <UiDatatable class="nowrap hover stripe" :data="rows" :options="options" @ready="onReady" />
  </div>
</template>
