<script setup lang="ts">
  import { complexStruct2ColumnPaths, complexStruct2Schema } from "~/lib/datatable-example-schemas";
  import { formatNumber } from "~/lib/datatable-examples";
  import { createComplexStruct2Rows } from "~/lib/generated-mocks";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Config } from "datatables.net";

  const rows = createComplexStruct2Rows(5);
  const total = rows.reduce((sum, row) => sum + row.nested_field.foo.foo_foo, 0);

  const options: Config = {
    dom: "t",
    ordering: false,
  };

  const columnOverrides: SchemaColumnOverrides = {
    "nested_field.foo.foo_bar": {
      render: (value: unknown, type: string) => {
        if (type !== "display") return value;

        const label = String(value);
        const wrapper = document.createElement("div");
        wrapper.className = "flex items-center gap-3";

        const image = document.createElement("span");
        image.ariaHidden = "true";
        image.className =
          "bg-primary/10 text-primary grid size-10 place-items-center rounded-full font-semibold uppercase";
        image.textContent = label.slice(0, 2);

        const copy = document.createElement("div");
        const name = document.createElement("p");
        name.className = "font-medium";
        name.textContent = label;
        const username = document.createElement("p");
        username.className = "text-muted-foreground text-xs";
        username.textContent = "Generated FooStruct";
        copy.append(name, username);
        wrapper.append(image, copy);
        return wrapper;
      },
    },
    "nested_field.foo.foo_foo": {
      className: "dt-body-right",
      render: (value: unknown, type: string) =>
        type === "display" ? formatNumber(Number(value)) : value,
    },
  };
</script>

<template>
  <div class="overflow-hidden">
    <UiSchemaDatatable
      class="nowrap hover row-border"
      :schema="complexStruct2Schema"
      :data="rows"
      :column-paths="complexStruct2ColumnPaths.compact"
      :column-overrides="columnOverrides"
      :options="options"
    />
    <div class="flex items-center justify-between border-t px-4 py-5 text-sm md:px-6">
      <p class="text-muted-foreground">Total</p>
      <p class="font-semibold tabular-nums">{{ formatNumber(total) }}</p>
    </div>
  </div>
</template>
