<script setup lang="ts" generic="T extends Record<string, any>">
  import { buildSchemaDatatableModel } from "~/lib/dt-schema-datatable";
  import type { JsonSchema7 } from "@jsonforms/core";
  import type { SchemaColumnOverrides, SchemaDatatableCellSlotProps } from "~/lib/dt-schema-datatable";
  import type { SchemaEntry } from "~/lib/dt-schema-resolver";
  import type {
    Api,
    CellMetaSettings,
    Config,
    ConfigColumns,
    ObjectColumnRender,
  } from "datatables.net";
  import type { HTMLAttributes } from "vue";

  defineOptions({ inheritAttrs: false });

  const props = withDefaults(
    defineProps<{
      schema: JsonSchema7;
      data?: readonly T[];
      ajax?: Config["ajax"];
      options?: Config;
      class?: HTMLAttributes["class"];
      columnOverrides?: SchemaColumnOverrides;
      columnPaths?: readonly string[];
    }>(),
    {
      options: () => ({}),
      data: () => [],
      class: "nowrap hover order-column row-border stripe display",
      columnOverrides: () => ({}),
    }
  );

  const emit = defineEmits<{
    ready: [Api<T> | undefined];
  }>();

  const slots = defineSlots<{
    [fieldName: string]: (props: SchemaDatatableCellSlotProps<T>) => any;
  }>();

  interface MountedSchemaCell extends SchemaDatatableCellSlotProps<T> {
    host: HTMLDivElement;
    key: string;
    slotName: string;
  }

  type CellDisplayRenderer = (
    data: unknown,
    type: string,
    row: unknown,
    meta: CellMetaSettings
  ) => unknown;

  const tableApi = shallowRef<Api<T>>();
  const instanceKey = ref(0);
  const mountedCells = shallowReactive(new Map<string, MountedSchemaCell>());
  const mountedCellList = computed(() => [...mountedCells.values()]);
  let eventApi: Api<T> | undefined;

  // Deliberately excludes row data: a schema/config revision is compiled once,
  // while DataTables handles data refreshes without revisiting the schema.
  const model = computed(() =>
    buildSchemaDatatableModel(props.schema, props.columnOverrides, props.columnPaths)
  );
  const columnEntries = computed(() => model.value.columnEntries);
  const columns = computed(() =>
    model.value.columns.map((column, index) => {
      const entry = model.value.columnEntries[index];
      const slotName = entry?.dataSegments.at(-1);
      if (!entry || !slotName || !slots[slotName]) return column;

      return {
        ...column,
        render: withDisplayRenderer(column.render, createCellRenderer(entry, slotName)),
      };
    })
  );
  const config = computed<Config>(() => ({
    ...props.options,
    columns: columns.value,
  }));

  const isObjectRenderer = (renderer: ConfigColumns["render"]): boolean =>
    renderer !== null && typeof renderer === "object" && !Array.isArray(renderer);

  const withDisplayRenderer = (
    renderer: ConfigColumns["render"],
    display: CellDisplayRenderer
  ): ObjectColumnRender => {
    if (isObjectRenderer(renderer)) {
      return { ...(renderer as ObjectColumnRender), display };
    }

    return renderer === undefined
      ? { display }
      : { _: renderer as ObjectColumnRender["_"], display };
  };

  const createCellRenderer =
    (entry: SchemaEntry, slotName: string): CellDisplayRenderer =>
    (fieldValue: unknown, type: string, row: unknown, meta: CellMetaSettings) => {
      const settings = meta.settings as CellMetaSettings["settings"] & { tableId?: string };
      const tableId = settings.sTableId || settings.tableId || String(instanceKey.value);
      const key = `${tableId},${meta.row},${meta.col}`;
      const existing = mountedCells.get(key);
      const rowData = row as T;
      const host = existing?.host ?? document.createElement("div");

      if (!existing) {
        host.className = "schema-datatable-cell-host";
        host.dataset.schemaColumnPath = entry.dataPath;
      }

      if (
        !existing ||
        existing.fieldValue !== fieldValue ||
        existing.rowData !== rowData ||
        existing.columnEntry !== entry ||
        existing.slotName !== slotName
      ) {
        mountedCells.set(key, {
          cellData: rowData,
          colIndex: meta.col,
          columnEntry: entry,
          columnPath: entry.dataPath,
          fieldValue,
          host,
          key,
          rowData,
          rowIndex: meta.row,
          slotName,
          type,
        });
      }

      return host;
    };

  const clearMountedCells = () => mountedCells.clear();

  const handlePreXhr = () => {
    clearMountedCells();
  };

  const detachTableEvents = () => {
    eventApi?.off("preXhr", handlePreXhr);
    eventApi = undefined;
  };

  const handleReady = (api: Api<Record<string, any>> | undefined) => {
    detachTableEvents();
    const typedApi = api as unknown as Api<T> | undefined;
    tableApi.value = typedApi;
    eventApi = typedApi;
    eventApi?.on("preXhr", handlePreXhr);
    emit("ready", typedApi);
  };

  watch(
    () => props.data,
    () => clearMountedCells(),
    { deep: true, flush: "sync" }
  );

  watch(
    [
      () => props.schema,
      () => props.columnOverrides,
      () => props.columnPaths,
      () => props.options,
      () => props.ajax,
    ],
    () => {
      detachTableEvents();
      clearMountedCells();
      tableApi.value = undefined;
      instanceKey.value += 1;
    },
    { deep: true, flush: "sync" }
  );

  onBeforeUnmount(() => {
    detachTableEvents();
    clearMountedCells();
  });

  defineExpose({
    dt: computed(() => tableApi.value),
    config,
    columns,
    columnEntries,
  });
</script>

<template>
  <UiDatatable
    :key="instanceKey"
    v-bind="$attrs"
    data-ui-schema-datatable
    :ajax="ajax"
    :data="data as T[]"
    :class="props.class"
    :options="config"
    @ready="handleReady"
  />

  <Teleport v-for="cell in mountedCellList" :key="cell.key" :to="cell.host">
    <slot
      :name="cell.slotName"
      :cell-data="cell.cellData"
      :col-index="cell.colIndex"
      :column-entry="cell.columnEntry"
      :column-path="cell.columnPath"
      :field-value="cell.fieldValue"
      :row-data="cell.rowData"
      :row-index="cell.rowIndex"
      :type="cell.type"
    />
  </Teleport>
</template>
