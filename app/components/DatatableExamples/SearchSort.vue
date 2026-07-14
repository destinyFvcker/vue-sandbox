<script setup lang="ts">
  import { keywordColumnPaths, keywordRowSchema } from "~/lib/datatable-example-schemas";
  import { keywordRows } from "~/lib/datatable-examples";
  import type { KeywordIntent } from "~/lib/datatable-examples";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Config } from "datatables.net";

  const search = ref("");
  const normalizedSearch = computed(() => search.value.trim().toLowerCase());
  const rows = computed(() => {
    if (!normalizedSearch.value) return keywordRows;

    return keywordRows.filter((row) =>
      [row.keyword, ...row.intents, row.volume, row.cpc, row.traffic]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch.value)
    );
  });

  const intentClasses: Record<KeywordIntent, string> = {
    Informational: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    Navigational: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    Commercial: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    Transactional: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  };

  const options: Config = {
    dom: "t",
    paging: false,
    order: [[2, "desc"]],
  };

  const columnOverrides: SchemaColumnOverrides = {
    volume: { className: "dt-body-right" },
    cpc: { className: "dt-body-right" },
    traffic: { className: "dt-body-right" },
    link: { orderable: false, searchable: false },
  };
</script>

<template>
  <div class="bg-background overflow-hidden rounded-lg border">
    <div class="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm font-medium">Keyword performance</p>
        <p class="text-muted-foreground text-xs">点击表头可按数值列排序</p>
      </div>
      <label class="relative block sm:w-72">
        <Icon
          name="lucide:search"
          class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <input
          v-model="search"
          data-testid="keyword-search"
          class="focus:ring-ring h-9 w-full rounded-md border bg-transparent pr-3 pl-9 text-sm outline-none focus:ring-2"
          placeholder="Search keywords or intent…"
          type="search"
        />
      </label>
    </div>

    <UiSchemaDatatable
      class="nowrap hover row-border"
      :schema="keywordRowSchema"
      :data="rows"
      :column-paths="keywordColumnPaths"
      :column-overrides="columnOverrides"
      :options="options"
    >
      <template #cell-intents="{ cellData }">
        <span class="flex flex-wrap gap-1.5">
          <span
            v-for="intent in cellData as KeywordIntent[]"
            :key="intent"
            :class="['rounded-full px-2 py-1 text-xs font-medium', intentClasses[intent]]"
          >
            {{ intent }}
          </span>
        </span>
      </template>

      <template #cell-cpc="{ cellData }"> ${{ (cellData as number).toFixed(2) }} </template>

      <template #cell-link="{ cellData }">
        <a
          :href="String(cellData)"
          class="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
          rel="noreferrer"
          target="_blank"
        >
          Open
          <Icon name="lucide:external-link" class="size-3.5" />
        </a>
      </template>
    </UiSchemaDatatable>

    <div class="text-muted-foreground border-t px-4 py-3 text-xs">
      Showing {{ rows.length }} of {{ keywordRows.length }} keywords
    </div>
  </div>
</template>
