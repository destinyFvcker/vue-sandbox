<script setup lang="ts">
  import { complexStruct2ColumnPaths, complexStruct2Schema } from "~/lib/datatable-example-schemas";
  import { formatNumber } from "~/lib/datatable-examples";
  import { createComplexStruct2Rows } from "~/lib/generated-mocks";
  import type { ComplexStruct2 } from "~/lib/generated-mocks";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Api, Config } from "datatables.net";

  type ColReorderApi = Api<ComplexStruct2> & {
    colReorder: {
      disable: () => Api<ComplexStruct2>;
      enable: () => Api<ComplexStruct2>;
      reset: () => Api<ComplexStruct2>;
    };
  };

  const rows = createComplexStruct2Rows(24);
  const table = shallowRef<Api<ComplexStruct2>>();
  const reorderEnabled = ref(true);

  const options: Config = {
    dom: "<'flex items-center justify-between gap-3 border-b p-4'f><'overflow-auto't><'flex flex-col gap-3 border-t p-4 text-sm sm:flex-row sm:items-center sm:justify-between'ip>",
    pageLength: 8,
    colReorder: true,
  };

  const columnOverrides: SchemaColumnOverrides = {
    "nested_field.foo.foo_foo": {
      className: "dt-body-right",
      render: (value: unknown, type: string) =>
        type === "display" ? formatNumber(Number(value)) : value,
    },
  };

  function onReady(api?: Api<ComplexStruct2>) {
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
    <UiSchemaDatatable
      class="nowrap hover stripe row-border"
      :schema="complexStruct2Schema"
      :data="rows"
      :options="options"
      :column-overrides="columnOverrides"
      :column-paths="complexStruct2ColumnPaths.nested"
      @ready="onReady"
    />
  </div>
</template>
