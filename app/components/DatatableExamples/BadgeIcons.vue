<script setup lang="ts">
  import { demoPersonSchema, personColumnPaths } from "~/lib/datatable-example-schemas";
  import { createDemoPeople } from "~/lib/datatable-examples";
  import type { DemoPerson } from "~/lib/datatable-examples";
  import type { Config } from "datatables.net";

  const rows = createDemoPeople(30);

  const options: Config = {
    dom: "t",
    paging: false,
    scrollY: "360px",
  };

  function asPerson(row: DemoPerson | Record<string, unknown>): DemoPerson {
    return row as DemoPerson;
  }
</script>

<template>
  <div class="bg-background overflow-hidden rounded-lg border">
    <UiSchemaDatatable
      class="nowrap hover row-border"
      :schema="demoPersonSchema"
      :data="rows"
      :column-paths="personColumnPaths.badgeIcons"
      :options="options"
    >
      <template #cell-status="{ cellData }">
        <span
          :class="[
            'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium',
            cellData === 'Active'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
          ]"
        >
          <span
            :class="[
              'size-1.5 rounded-full',
              cellData === 'Active' ? 'bg-emerald-500' : 'bg-slate-400',
            ]"
          />
          {{ cellData }}
        </span>
      </template>

      <template #cell-location-city="{ rowData }">
        <span class="inline-flex items-center gap-2">
          <span class="text-base" aria-hidden="true">{{ asPerson(rowData).location.flag }}</span>
          <span>
            <span class="block font-medium">{{ asPerson(rowData).location.city }}</span>
            <span class="text-muted-foreground block text-xs">
              {{ asPerson(rowData).location.country }}
            </span>
          </span>
        </span>
      </template>
    </UiSchemaDatatable>
  </div>
</template>
