<script setup lang="ts">
  import {
    programmingLanguageColumnPaths,
    programmingLanguageSchema,
  } from "~/lib/datatable-example-schemas";
  import { programmingLanguages } from "~/lib/datatable-examples";
  import type { Config } from "datatables.net";

  const options: Config = {
    dom: "t",
    paging: false,
    ordering: false,
  };
</script>

<template>
  <div class="bg-background overflow-hidden rounded-lg border">
    <UiSchemaDatatable
      class="nowrap hover compact demo-dense"
      :schema="programmingLanguageSchema"
      :data="programmingLanguages"
      :options="options"
      :column-paths="programmingLanguageColumnPaths"
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
