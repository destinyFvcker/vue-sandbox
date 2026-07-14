<script setup lang="ts">
  import { demoPersonSchema, personColumnPaths } from "~/lib/datatable-example-schemas";
  import { createDemoPeople } from "~/lib/datatable-examples";
  import type { DemoPerson } from "~/lib/datatable-examples";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Config } from "datatables.net";

  const rows = createDemoPeople(80);
  const lastEdited = ref("No row selected");

  const options: Config = {
    dom: "<'flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between'Bf><'overflow-auto't><'flex flex-col gap-3 border-t p-4 text-sm md:flex-row md:items-center md:justify-between'ip>",
    pageLength: 8,
    responsive: true,
    select: true,
    buttons: ["copy", "csv", "excel", "print", "colvis"],
  };

  const columnOverrides: SchemaColumnOverrides = {
    __action: {
      searchable: false,
      orderable: false,
      render: (value: unknown, type: string, row: unknown) => {
        if (type !== "display") return value;

        const button = document.createElement("button");
        button.className =
          "hover:bg-muted inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium";
        button.dataset.testid = "edit-row-button";
        button.type = "button";
        button.textContent = "Edit";
        button.addEventListener("click", () => editRow(row as DemoPerson));
        return button;
      },
    },
  };

  function editRow(row: DemoPerson | Record<string, unknown>) {
    lastEdited.value = `Editing ${(row as DemoPerson).name}`;
  }
</script>

<template>
  <div class="bg-background overflow-hidden rounded-lg border">
    <div class="flex items-center justify-between gap-4 border-b px-4 py-3 text-sm">
      <p class="font-medium">Native DataTables cell renderer</p>
      <p class="text-muted-foreground" data-testid="custom-component-status">{{ lastEdited }}</p>
    </div>
    <UiSchemaDatatable
      class="nowrap hover row-border"
      :schema="demoPersonSchema"
      :data="rows"
      :column-paths="personColumnPaths.customComponent"
      :column-overrides="columnOverrides"
      :options="options"
    />
  </div>
</template>
