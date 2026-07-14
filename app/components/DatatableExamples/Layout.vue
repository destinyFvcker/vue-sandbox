<script setup lang="ts">
  import { demoPersonSchema, personColumnPaths } from "~/lib/datatable-example-schemas";
  import { createDemoPeople, formatCurrency } from "~/lib/datatable-examples";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Config } from "datatables.net";

  const rows = createDemoPeople(36);

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
    balance: { className: "dt-body-right" },
  };
</script>

<template>
  <div class="bg-background overflow-hidden rounded-lg border p-4">
    <UiSchemaDatatable
      class="nowrap hover stripe"
      :schema="demoPersonSchema"
      :data="rows"
      :options="options"
      :column-overrides="columnOverrides"
      :column-paths="personColumnPaths.layout"
    >
      <template #cell-balance="{ cellData }">
        {{ formatCurrency(cellData as number) }}
      </template>
    </UiSchemaDatatable>
  </div>
</template>
