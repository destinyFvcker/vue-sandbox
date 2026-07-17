<script setup lang="ts">
  import { complexStruct2ColumnPaths, complexStruct2Schema } from "~/lib/datatable-example-schemas";
  import { formatNumber } from "~/lib/datatable-examples";
  import { complexStruct2Rows, createComplexStruct2Rows } from "~/lib/generated-mocks";
  import type { ComplexStruct2 } from "~/lib/generated-mocks";
  import type { SchemaColumnOverrides } from "~/lib/dt-schema-datatable";
  import type { Config } from "datatables.net";

  useHead({ title: "Generated JSON Schema DataTable Demo" });

  const rows = ref<ComplexStruct2[]>(createComplexStruct2Rows(12));
  let nextGeneratedIndex = 12;

  const options: Config = {
    pageLength: 5,
    lengthMenu: [5, 10, 25],
    order: [[0, "asc"]],
    responsive: false,
  };

  const columnOverrides: SchemaColumnOverrides = {
    "nested_field.foo.foo_foo": {
      className: "dt-body-right",
      render: (value: unknown, type: string) =>
        type === "display" ? formatNumber(Number(value)) : value,
    },
    "nested_field.bar.bar_foo": {
      className: "dt-body-right",
      render: (value: unknown, type: string) =>
        type === "display" && value != null ? formatNumber(Number(value)) : value,
    },
    normal_enum: {
      render: (value: unknown, type: string) => {
        if (type !== "display") return value;

        const badge = document.createElement("span");
        badge.className =
          "text-primary bg-primary/10 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide uppercase";
        badge.textContent = String(value ?? "—");
        return badge;
      },
    },
  };

  const addRow = () => {
    const row = complexStruct2Rows[nextGeneratedIndex % complexStruct2Rows.length]!;
    nextGeneratedIndex += 1;
    rows.value.push(row);
  };
</script>

<template>
  <main class="mx-auto min-h-screen max-w-7xl space-y-6 p-4 md:p-8">
    <header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <NuxtLink to="/" class="text-muted-foreground hover:text-foreground text-sm">
          ← Back
        </NuxtLink>
        <h1 class="mt-2 text-3xl font-bold tracking-tight">Generated JSON Schema DataTable</h1>
        <p class="text-muted-foreground mt-2 max-w-3xl text-sm">
          Rust schemars 生成的 schema 会编译成原生 DataTables 列；页面数据直接来自配套的
          complex_struct_2 mock。
        </p>
      </div>
      <UiButton data-testid="add-row" icon="lucide:plus" @click="addRow">
        Add generated row
      </UiButton>
    </header>

    <UiCard>
      <UiCardHeader>
        <UiCardTitle>ComplexStruct2</UiCardTitle>
        <UiCardDescription>
          当前接入稳定可展示的嵌套标量和普通枚举；tuple 与 struct enum 暂不投影为列。
        </UiCardDescription>
      </UiCardHeader>
      <UiCardContent data-testid="schema-datatable-demo">
        <UiSchemaDatatable
          :schema="complexStruct2Schema"
          :data="rows"
          :options="options"
          :column-paths="complexStruct2ColumnPaths.nested"
          :column-overrides="columnOverrides"
        />
      </UiCardContent>
    </UiCard>
  </main>
</template>
