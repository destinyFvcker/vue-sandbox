<script setup lang="ts">
  import { programmingLanguages } from "~/lib/datatable-examples";
  import type { Config } from "datatables.net";

  const options: Config = {
    dom: "t",
    paging: false,
    ordering: false,
    columns: [
      { title: "Name", data: "name" },
      { title: "Released", data: "releaseYear" },
      { title: "Developer", data: "developer" },
      { title: "Typing", data: "typing" },
      { title: "Paradigm", data: "paradigm" },
      { title: "Extension", data: "extension" },
      { title: "Latest", data: "latestVersion" },
      { title: "Popularity", data: "popularity" },
    ],
  };
</script>

<template>
  <div class="bg-background overflow-hidden rounded-lg border">
    <UiDatatable
      class="nowrap hover compact demo-dense"
      :data="programmingLanguages"
      :options="options"
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
