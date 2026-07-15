<script setup lang="ts">
  import { complexStructColumnPaths, complexStructSchema } from "~/lib/datatable-example-schemas";
  import { createComplexStructRows } from "~/lib/generated-mocks";
  import type { Config } from "datatables.net";

  const options: Config = {
    dom: "t",
    paging: false,
    ordering: false,
  };
  const rows = createComplexStructRows(12);
</script>

<template>
  <div class="bg-background overflow-hidden rounded-lg border">
    <UiSchemaDatatable
      class="nowrap hover compact demo-dense"
      :schema="complexStructSchema"
      :data="rows"
      :options="options"
      :column-paths="complexStructColumnPaths"
    />
  </div>
</template>

<style scoped>
  :deep(table.dataTable.demo-dense th),
  :deep(table.dataTable.demo-dense td) {
    padding-block: 0.45rem;
    font-size: 0.8125rem;
  }
</style>
