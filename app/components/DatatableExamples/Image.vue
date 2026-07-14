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
    name: {
      render: (value: unknown, type: string, row: unknown) => {
        if (type !== "display") return value;

        const person = row as DemoPerson;
        const wrapper = document.createElement("div");
        wrapper.className = "flex items-center gap-3";

        const image = document.createElement("img");
        image.alt = person.name;
        image.className = "size-10 rounded-full object-cover";
        image.src = person.image;

        const copy = document.createElement("div");
        const name = document.createElement("p");
        name.className = "font-medium";
        name.textContent = person.name;
        const username = document.createElement("p");
        username.className = "text-muted-foreground text-xs";
        username.textContent = `@${person.username}`;
        copy.append(name, username);
        wrapper.append(image, copy);
        return wrapper;
      },
    },
    balance: {
      className: "dt-body-right",
      render: (value: unknown, type: string) =>
        type === "display" ? formatCurrency(Number(value)) : value,
    },
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
    />
    <div class="flex items-center justify-between border-t px-4 py-5 text-sm md:px-6">
      <p class="text-muted-foreground">Total</p>
      <p class="font-semibold tabular-nums">{{ formatCurrency(total) }}</p>
    </div>
  </div>
</template>
