<script setup lang="ts">
  import { complexStruct2ColumnPaths, complexStruct2Schema } from "~/lib/datatable-example-schemas";
  import { createComplexStruct2Rows } from "~/lib/generated-mocks";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Config } from "datatables.net";

  const search = ref("");
  const normalizedSearch = computed(() => search.value.trim().toLowerCase());
  const generatedRows = createComplexStruct2Rows();
  const rows = computed(() => {
    if (!normalizedSearch.value) return generatedRows;

    return generatedRows.filter((row) =>
      [
        row.nested_field.foo.foo_foo,
        row.nested_field.foo.foo_bar,
        row.nested_field.foo.foo_qux,
        row.normal_enum,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch.value)
    );
  });

  const options: Config = {
    dom: "t",
    paging: false,
    order: [[0, "desc"]],
  };

  const columnOverrides: SchemaColumnOverrides = {
    normal_enum: {
      render: (value: unknown, type: string) => {
        if (type !== "display") return value;

        const badge = document.createElement("span");
        badge.className =
          value === "Foo"
            ? "rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300"
            : "rounded-full bg-violet-500/10 px-2 py-1 text-xs font-medium text-violet-700 dark:text-violet-300";
        badge.textContent = String(value);
        return badge;
      },
    },
    "nested_field.foo.foo_foo": { className: "dt-body-right" },
  };
</script>

<template>
  <div class="bg-background overflow-hidden rounded-lg border">
    <div class="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm font-medium">Generated FooStruct records</p>
        <p class="text-muted-foreground text-xs">点击表头可按数值列排序</p>
      </div>
      <label class="relative block sm:w-72">
        <Icon
          name="lucide:search"
          class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <input
          v-model="search"
          data-testid="generated-search"
          class="focus:ring-ring h-9 w-full rounded-md border bg-transparent pr-3 pl-9 text-sm outline-none focus:ring-2"
          placeholder="Search generated fields…"
          type="search"
        />
      </label>
    </div>

    <UiSchemaDatatable
      class="nowrap hover row-border"
      :schema="complexStruct2Schema"
      :data="rows"
      :column-paths="complexStruct2ColumnPaths.compact"
      :column-overrides="columnOverrides"
      :options="options"
    />

    <div class="text-muted-foreground border-t px-4 py-3 text-xs">
      Showing {{ rows.length }} of {{ generatedRows.length }} generated records
    </div>
  </div>
</template>
