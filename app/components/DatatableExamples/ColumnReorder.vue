<script setup lang="ts">
  import { createDemoPeople, formatCurrency } from "~/lib/datatable-examples";
  import type { DemoPerson } from "~/lib/datatable-examples";
  import type { Api, Config } from "datatables.net";

  type ColReorderApi = Api<DemoPerson> & {
    colReorder: {
      disable: () => Api<DemoPerson>;
      enable: () => Api<DemoPerson>;
      reset: () => Api<DemoPerson>;
    };
  };

  const rows = createDemoPeople(24);
  const table = shallowRef<Api<DemoPerson>>();
  const reorderEnabled = ref(true);

  const options: Config = {
    dom: "<'flex items-center justify-between gap-3 border-b p-4'f><'overflow-auto't><'flex flex-col gap-3 border-t p-4 text-sm sm:flex-row sm:items-center sm:justify-between'ip>",
    pageLength: 8,
    colReorder: true,
    columns: [
      { title: "Name", data: "name" },
      { title: "Email", data: "email" },
      { title: "Position", data: "position" },
      { title: "Office", data: "office" },
      { title: "Department", data: "department" },
      { title: "Status", data: "status" },
      {
        title: "Balance",
        data: "balance",
        className: "dt-body-right",
        render: (value: number) => formatCurrency(value),
      },
    ],
  };

  function onReady(api?: Api<DemoPerson>) {
    table.value = api;
  }

  function setReorder(enabled: boolean) {
    const colReorder = (table.value as ColReorderApi | undefined)?.colReorder;
    if (!colReorder) return;

    if (enabled) colReorder.enable();
    else colReorder.disable();
    reorderEnabled.value = enabled;
  }

  function resetOrder() {
    (table.value as ColReorderApi | undefined)?.colReorder?.reset();
  }
</script>

<template>
  <div class="bg-background overflow-hidden rounded-lg border">
    <div class="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm font-medium">Drag column headers</p>
        <p class="text-muted-foreground text-xs">拖动任意表头即可修改列顺序</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span
          class="text-muted-foreground mr-1 inline-flex items-center gap-1.5 text-xs"
          data-testid="reorder-status"
        >
          <span
            :class="['size-1.5 rounded-full', reorderEnabled ? 'bg-emerald-500' : 'bg-slate-400']"
          />
          {{ reorderEnabled ? "Reorder enabled" : "Reorder locked" }}
        </span>
        <button
          class="hover:bg-muted h-8 rounded-md border px-3 text-xs font-medium disabled:opacity-50"
          type="button"
          :disabled="!reorderEnabled"
          @click="setReorder(false)"
        >
          Lock
        </button>
        <button
          class="hover:bg-muted h-8 rounded-md border px-3 text-xs font-medium disabled:opacity-50"
          type="button"
          :disabled="reorderEnabled"
          @click="setReorder(true)"
        >
          Unlock
        </button>
        <button
          class="hover:bg-muted h-8 rounded-md border px-3 text-xs font-medium"
          type="button"
          @click="resetOrder"
        >
          Reset
        </button>
      </div>
    </div>
    <UiDatatable
      class="nowrap hover stripe row-border"
      :data="rows"
      :options="options"
      @ready="onReady"
    />
  </div>
</template>
