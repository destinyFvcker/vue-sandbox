<script setup lang="ts">
  import { demoPersonSchema, personColumnPaths } from "~/lib/datatable-example-schemas";
  import { createDemoPeople, formatCurrency } from "~/lib/datatable-examples";
  import type { DemoPerson } from "~/lib/datatable-examples";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Config } from "datatables.net";

  const rows = createDemoPeople(5);
  const total = rows.reduce((sum, row) => sum + row.balance, 0);

  const options: Config = {
    dom: "t",
    ordering: false,
  };

  const columnOverrides: SchemaColumnOverrides = {
    id: { visible: false },
    balance: { className: "dt-body-right" },
  };
</script>

<template>
  <div class="overflow-hidden">
    <UiSchemaDatatable
      class="nowrap hover row-border"
      :schema="demoPersonSchema"
      :data="rows"
      :column-paths="personColumnPaths.simple"
      :column-overrides="columnOverrides"
      :options="options"
    >
      <template #cell-name="{ rowData }">
        <div class="flex items-center gap-3">
          <img
            :alt="(rowData as DemoPerson).name"
            class="size-10 rounded-full object-cover"
            :src="(rowData as DemoPerson).image"
          />
          <div>
            <p class="font-medium">{{ (rowData as DemoPerson).name }}</p>
            <p class="text-muted-foreground text-xs">@{{ (rowData as DemoPerson).username }}</p>
          </div>
        </div>
      </template>

      <template #cell-balance="{ cellData }">
        {{ formatCurrency(cellData as number) }}
      </template>
    </UiSchemaDatatable>
    <div class="flex items-center justify-between border-t px-4 py-5 text-sm md:px-6">
      <p class="text-muted-foreground">Total</p>
      <p class="font-semibold tabular-nums">{{ formatCurrency(total) }}</p>
    </div>
  </div>
</template>
