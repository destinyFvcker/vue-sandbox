<script setup lang="ts">
  import {
    complexStruct2ColumnPaths,
    selectableComplexStruct2Schema,
  } from "~/lib/datatable-example-schemas";
  import { formatNumber } from "~/lib/datatable-examples";
  import { createSelectRenderer } from "~/lib/datatables.client";
  import { complexStruct2Rows, createComplexStruct2Rows } from "~/lib/generated-mocks";
  import { getValueAtPath } from "~/lib/schema-resolver";
  import type { ComplexStruct2 } from "~/lib/generated-mocks";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Api, Config } from "datatables.net";

  interface AjaxRequest {
    draw?: number;
    start?: number;
    length?: number;
    search?: { value?: string };
    order?: Array<{ column: number; dir: "asc" | "desc" }>;
    columns?: Array<{ name?: string }>;
  }

  interface AjaxResponse {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: ComplexStruct2[];
  }

  const allRows = ref(createComplexStruct2Rows(99));
  const table = shallowRef<Api<ComplexStruct2>>();
  let nextGeneratedIndex = 99;

  const options: Config = {
    serverSide: true,
    processing: true,
    pageLength: 5,
    lengthMenu: [5, 10, 25, 50],
    pagingType: "full_numbers",
    dom: "<'flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between'Bf><'overflow-auto't><'flex flex-col gap-3 border-t p-4 text-sm md:flex-row md:items-center md:justify-between'lip>",
    language: {
      search: "Filter:",
      lengthMenu: "Show _MENU_",
      info: "Showing _START_ to _END_ of _TOTAL_ generated records",
      processing: "Loading generated records…",
      paginate: {
        first: "First",
        previous: "Previous",
        next: "Next",
        last: "Last",
      },
    },
    buttons: [
      "colvis",
      "print",
      {
        text: "Add generated row",
        action: () => addGeneratedRow(),
      },
    ],
    select: {
      style: "multi",
      selector: "td:first-child",
    },
  };

  const columnOverrides: SchemaColumnOverrides = {
    __select: {
      searchable: false,
      orderable: false,
      render: createSelectRenderer(),
    },
    "nested_field.foo.foo_foo": {
      className: "dt-body-right",
      render: (value: unknown, type: string) =>
        type === "display" ? formatNumber(Number(value)) : value,
    },
  };

  const searchableValues = (row: ComplexStruct2): unknown[] => [
    row.nested_field.foo.foo_foo,
    row.nested_field.foo.foo_bar,
    row.nested_field.foo.foo_qux,
    row.nested_field.bar?.bar_foo,
    row.nested_field.bar?.bar_bar,
    row.nested_field.bar?.bar_qux,
    row.normal_enum,
  ];

  const ajax: Config["ajax"] = (request, callback) => {
    const query = request as AjaxRequest;
    const search = query.search?.value?.trim().toLowerCase() ?? "";
    const start = query.start ?? 0;
    const length = query.length ?? 5;

    let filtered = allRows.value.filter((row) => {
      if (!search) return true;
      return searchableValues(row).join(" ").toLowerCase().includes(search);
    });

    const order = query.order?.[0];
    const columnKey = order ? query.columns?.[order.column]?.name : undefined;
    if (order && typeof columnKey === "string") {
      const segments = columnKey.split(".");
      filtered = [...filtered].sort((left, right) => {
        const leftValue = getValueAtPath(left, segments);
        const rightValue = getValueAtPath(right, segments);
        const result =
          typeof leftValue === "number" && typeof rightValue === "number"
            ? leftValue - rightValue
            : String(leftValue ?? "").localeCompare(String(rightValue ?? ""));
        return order.dir === "asc" ? result : -result;
      });
    }

    const response: AjaxResponse = {
      draw: query.draw ?? 0,
      recordsTotal: allRows.value.length,
      recordsFiltered: filtered.length,
      data: filtered.slice(start, start + length),
    };

    window.setTimeout(() => callback(response), 120);
  };

  function onReady(api?: Api<Record<string, any>>) {
    table.value = api as unknown as Api<ComplexStruct2> | undefined;
  }

  function addGeneratedRow() {
    const row = complexStruct2Rows[nextGeneratedIndex % complexStruct2Rows.length]!;
    nextGeneratedIndex += 1;
    allRows.value = [row, ...allRows.value];
    table.value?.ajax.reload(undefined, false);
  }
</script>

<template>
  <div class="bg-background overflow-hidden rounded-lg border">
    <UiSchemaDatatable
      class="nowrap hover stripe order-column"
      :schema="selectableComplexStruct2Schema"
      :ajax="ajax"
      :column-paths="complexStruct2ColumnPaths.selectable"
      :column-overrides="columnOverrides"
      :options="options"
      @ready="onReady"
    >
      <template #normal_enum="{ fieldValue }">
        <span
          :class="[
            'rounded-full px-2 py-1 text-xs font-medium',
            fieldValue === 'Foo'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
          ]"
          data-testid="server-enum-badge"
        >
          {{ fieldValue }}
        </span>
      </template>
    </UiSchemaDatatable>
  </div>
</template>
