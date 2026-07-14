<script setup lang="ts" generic="T extends Record<string, unknown>">
  import { createAjv } from "@jsonforms/core";
  import SchemaArrayDetails from "~/components/SchemaDatatable/ArrayDetails.vue";
  import SchemaJsonFormsCell from "~/components/SchemaDatatable/JsonFormsCell.vue";
  import SchemaRowExpander from "~/components/SchemaDatatable/RowExpander.vue";
  import { buildSchemaDatatableModel } from "~/lib/schema-datatable";
  import { attachRootDefinitions, getValueAtPath } from "~/lib/schema-resolver";
  import type { JsonFormsRendererRegistryEntry, JsonSchema } from "@jsonforms/core";
  import type { SchemaColumnOverrides, SchemaDatatableAjv } from "~/lib/schema-datatable";
  import type { Api, Config } from "datatables.net";
  import type { HTMLAttributes } from "vue";

  interface ExpandedDetail {
    host: HTMLDivElement;
    id: number;
    rowData: T;
    rowIndex: number;
  }

  const props = withDefaults(
    defineProps<{
      ajv?: SchemaDatatableAjv;
      schema: JsonSchema;
      data: readonly T[];
      options?: Config;
      class?: HTMLAttributes["class"];
      renderers?: readonly JsonFormsRendererRegistryEntry[];
      columnOverrides?: SchemaColumnOverrides;
    }>(),
    {
      options: () => ({}),
      class: "nowrap hover order-column row-border stripe display",
      renderers: () => [],
      columnOverrides: () => ({}),
    }
  );

  const emit = defineEmits<{
    ready: [Api<T> | undefined];
  }>();

  const datatableRef = shallowRef<{ dt?: Api<T> } | null>(null);
  const tableApi = shallowRef<Api<T>>();
  const ajv = props.ajv ?? createAjv({ code: { es5: true } });
  const instanceKey = ref(0);
  const detailSequence = ref(0);
  const expandedDetails = shallowReactive(new Map<number, ExpandedDetail>());
  const selfComponent = getCurrentInstance()!.type;

  const model = computed(() => buildSchemaDatatableModel(props.schema, props.columnOverrides));
  const columns = computed(() => model.value.columns);
  const columnEntries = computed(() => model.value.columnEntries);
  const arrayEntries = computed(() => model.value.arrayEntries);
  const expandedDetailList = computed(() => [...expandedDetails.values()]);
  const resolvedOptions = computed<Config>(() => ({
    ...props.options,
    ...(arrayEntries.value.length > 0 && props.options.responsive ? { responsive: false } : {}),
  }));

  watchEffect(() => {
    if (arrayEntries.value.length > 0 && props.options.responsive) {
      console.warn(
        "[UiSchemaDatatable] Responsive child-row details are disabled when array details are present."
      );
    }
  });

  const getEntryForColumn = (columnIndex: number) =>
    columnEntries.value[columnIndex - (arrayEntries.value.length > 0 ? 1 : 0)];

  const getCellSchema = (columnIndex: number) => {
    const entry = getEntryForColumn(columnIndex);
    return entry ? attachRootDefinitions(entry.schema, model.value.rootSchema) : undefined;
  };

  const getCellValue = (rowData: T, columnIndex: number) => {
    const entry = getEntryForColumn(columnIndex);
    return entry ? getValueAtPath(rowData, entry.dataSegments) : undefined;
  };

  const collapseRow = (rowIndex: number) => {
    const detail = expandedDetails.get(rowIndex);
    if (!detail) return;

    const row = tableApi.value?.row(rowIndex);
    row?.child.hide();
    row?.node()?.classList.remove("dt-hasChild");
    expandedDetails.delete(rowIndex);

    void nextTick(() => {
      try {
        row?.child.remove();
      } catch {
        // The DataTables data watcher may already have removed the row.
      }
    });
  };

  const collapseAllRows = () => {
    for (const rowIndex of [...expandedDetails.keys()]) collapseRow(rowIndex);
  };

  const toggleRowDetails = (rowIndex: number, rowData: T) => {
    if (expandedDetails.has(rowIndex)) {
      collapseRow(rowIndex);
      return;
    }

    const row = tableApi.value?.row(rowIndex);
    if (!row) return;

    const host = document.createElement("div");
    host.className = "schema-datatable-details-host";
    row.child(host, "schema-datatable-details-cell").show();
    row.node()?.classList.add("dt-hasChild");
    expandedDetails.set(rowIndex, {
      host,
      id: detailSequence.value++,
      rowData,
      rowIndex,
    });
  };

  const handleReady = (api: Api<T> | undefined) => {
    tableApi.value = api;
    emit("ready", api);
  };

  watch(
    () => props.data,
    () => collapseAllRows(),
    { deep: true, flush: "sync" }
  );

  watch(
    [() => props.schema, () => props.renderers, () => props.columnOverrides, () => props.options],
    () => {
      collapseAllRows();
      tableApi.value = undefined;
      instanceKey.value += 1;
    },
    { flush: "sync" }
  );

  onBeforeUnmount(() => {
    for (const rowIndex of expandedDetails.keys()) {
      try {
        tableApi.value?.row(rowIndex).child.hide();
      } catch {
        // DataTables may already be tearing down.
      }
    }
  });

  defineExpose({
    dt: computed(() => tableApi.value),
    columns,
    columnEntries,
    arrayEntries,
  });
</script>

<template>
  <UiDatatable
    :key="instanceKey"
    ref="datatableRef"
    :data="data as T[]"
    :columns="columns"
    :class="props.class"
    :options="resolvedOptions"
    @ready="handleReady"
  >
    <template #schema-cell="{ colIndex, rowData }">
      <SchemaJsonFormsCell
        v-if="getCellSchema(colIndex)"
        :ajv="ajv"
        :data="getCellValue(rowData as T, colIndex)"
        :schema="getCellSchema(colIndex)!"
        :renderers="renderers"
      />
    </template>

    <template #schema-expand="{ rowData, rowIndex }">
      <SchemaRowExpander
        :array-entries="arrayEntries"
        :expanded-rows="expandedDetails"
        :row-data="rowData as T"
        :row-index="rowIndex"
        @toggle="toggleRowDetails"
      />
    </template>
  </UiDatatable>

  <Teleport v-for="detail in expandedDetailList" :key="detail.id" :to="detail.host">
    <SchemaArrayDetails
      :ajv="ajv"
      :array-entries="arrayEntries"
      :renderers="renderers"
      :root-schema="model.rootSchema"
      :row-data="detail.rowData"
      :table-component="selfComponent"
    />
  </Teleport>
</template>

<style>
  table.dataTable td.schema-datatable-control {
    width: 1%;
    padding-right: calc(var(--spacing) * 2);
    padding-left: calc(var(--spacing) * 2);
    white-space: nowrap;
  }

  table.dataTable > tbody > tr > td.schema-datatable-details-cell {
    padding: 0;
  }
</style>
