<script setup lang="ts">
  import { createDemoPeople } from "~/lib/datatable-examples";
  import type { DataTablesNamedSlotProps } from "~/components/Ui/Datatable.client.vue";
  import type { DemoPerson } from "~/lib/datatable-examples";
  import type { Config } from "datatables.net";

  const rows = createDemoPeople(80);
  const lastEdited = ref("No row selected");

  const options: Config = {
    dom: "<'flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between'Bf><'overflow-auto't><'flex flex-col gap-3 border-t p-4 text-sm md:flex-row md:items-center md:justify-between'ip>",
    pageLength: 8,
    responsive: true,
    select: true,
    buttons: ["copy", "csv", "excel", "print", "colvis"],
    columns: [
      {
        title: "Action",
        data: null,
        searchable: false,
        orderable: false,
        render: "#actions",
      },
      { title: "Name", data: "name" },
      { title: "Email", data: "email" },
      { title: "Position", data: "position" },
      { title: "Office", data: "office" },
      { title: "Last active", data: "lastActive" },
    ],
  };

  function editRow(row: DemoPerson | Record<string, unknown>) {
    lastEdited.value = `Editing ${(row as DemoPerson).name}`;
  }
</script>

<template>
  <div class="bg-background overflow-hidden rounded-lg border">
    <div class="flex items-center justify-between gap-4 border-b px-4 py-3 text-sm">
      <p class="font-medium">Vue cell component</p>
      <p class="text-muted-foreground" data-testid="custom-component-status">{{ lastEdited }}</p>
    </div>
    <UiDatatable class="nowrap hover row-border" :data="rows" :options="options">
      <template #actions="{ rowData }">
        <button
          class="hover:bg-muted inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium"
          data-testid="edit-row-button"
          type="button"
          @click="editRow(rowData as DataTablesNamedSlotProps<DemoPerson>['rowData'])"
        >
          Edit
        </button>
      </template>
    </UiDatatable>
  </div>
</template>
