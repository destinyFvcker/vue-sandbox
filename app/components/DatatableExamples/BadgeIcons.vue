<script setup lang="ts">
  import { complexStruct2ColumnPaths, complexStruct2Schema } from "~/lib/datatable-example-schemas";
  import { createComplexStruct2Rows } from "~/lib/generated-mocks";
  import type { SchemaColumnOverrides } from "~/lib/dt-schema-datatable";
  import type { Config } from "datatables.net";

  const rows = createComplexStruct2Rows(30);

  const options: Config = {
    dom: "t",
    paging: false,
    scrollY: "360px",
  };

  const columnOverrides: SchemaColumnOverrides = {
    normal_enum: {
      render: (value: unknown, type: string) => {
        if (type !== "display") return value;

        const status = String(value);
        const badge = document.createElement("span");
        badge.className = `inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
          status === "Foo"
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : "bg-slate-500/10 text-slate-600 dark:text-slate-300"
        }`;
        const dot = document.createElement("span");
        dot.className = `size-1.5 rounded-full ${
          status === "Foo" ? "bg-emerald-500" : "bg-slate-400"
        }`;
        badge.append(dot, document.createTextNode(status));
        return badge;
      },
    },
    "nested_field.foo.foo_bar": {
      render: (value: unknown, type: string) => {
        if (type !== "display") return value;

        const wrapper = document.createElement("span");
        wrapper.className = "inline-flex items-center gap-2";
        const icon = document.createElement("span");
        icon.className = "bg-primary/10 text-primary grid size-7 place-items-center rounded-full";
        icon.ariaHidden = "true";
        icon.textContent = "ƒ";
        const copy = document.createElement("span");
        copy.className = "font-medium";
        copy.textContent = String(value);
        wrapper.append(icon, copy);
        return wrapper;
      },
    },
  };
</script>

<template>
  <div class="bg-background overflow-hidden rounded-lg border">
    <UiSchemaDatatable
      class="nowrap hover row-border"
      :schema="complexStruct2Schema"
      :data="rows"
      :column-paths="complexStruct2ColumnPaths.compact"
      :column-overrides="columnOverrides"
      :options="options"
    />
  </div>
</template>
