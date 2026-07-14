<script setup lang="ts">
  import { demoPersonSchema, personColumnPaths } from "~/lib/datatable-example-schemas";
  import { createDemoPeople } from "~/lib/datatable-examples";
  import type { DemoPerson } from "~/lib/datatable-examples";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Config } from "datatables.net";

  const rows = createDemoPeople(30);

  const options: Config = {
    dom: "t",
    paging: false,
    scrollY: "360px",
  };

  const columnOverrides: SchemaColumnOverrides = {
    status: {
      render: (value: unknown, type: string) => {
        if (type !== "display") return value;

        const status = String(value);
        const badge = document.createElement("span");
        badge.className = `inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
          status === "Active"
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : "bg-slate-500/10 text-slate-600 dark:text-slate-300"
        }`;
        const dot = document.createElement("span");
        dot.className = `size-1.5 rounded-full ${
          status === "Active" ? "bg-emerald-500" : "bg-slate-400"
        }`;
        badge.append(dot, document.createTextNode(status));
        return badge;
      },
    },
    "location.city": {
      render: (value: unknown, type: string, row: unknown) => {
        if (type !== "display") return value;

        const person = row as DemoPerson;
        const wrapper = document.createElement("span");
        wrapper.className = "inline-flex items-center gap-2";
        const flag = document.createElement("span");
        flag.className = "text-base";
        flag.ariaHidden = "true";
        flag.textContent = person.location.flag;
        const copy = document.createElement("span");
        const city = document.createElement("span");
        city.className = "block font-medium";
        city.textContent = person.location.city;
        const country = document.createElement("span");
        country.className = "text-muted-foreground block text-xs";
        country.textContent = person.location.country;
        copy.append(city, country);
        wrapper.append(flag, copy);
        return wrapper;
      },
    },
  };
</script>

<template>
  <div class="bg-background overflow-hidden rounded-lg border">
    <UiSchemaDatatable
      class="nowrap hover row-border"
      :schema="demoPersonSchema"
      :data="rows"
      :column-paths="personColumnPaths.badgeIcons"
      :column-overrides="columnOverrides"
      :options="options"
    />
  </div>
</template>
