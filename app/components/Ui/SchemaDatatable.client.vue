<script setup lang="ts" generic="T extends Record<string, unknown>">
  import { createAjv } from "@jsonforms/core";
  import SchemaArrayDetails from "~/components/SchemaDatatable/ArrayDetails.vue";
  import SchemaJsonFormsCell from "~/components/SchemaDatatable/JsonFormsCell.vue";
  import SchemaRowExpander from "~/components/SchemaDatatable/RowExpander.vue";
  import { buildSchemaDatatableModel, getSchemaCellSlot } from "~/lib/schema-datatable";
  import { attachRootDefinitions, getValueAtPath } from "~/lib/schema-resolver";
  import type { JsonFormsRendererRegistryEntry, JsonSchema } from "@jsonforms/core";
  import type {
    SchemaCellSlots,
    SchemaColumnOverrides,
    SchemaDatatableAjv,
  } from "~/lib/schema-datatable";
  import type { SchemaEntry } from "~/lib/schema-resolver";
  import type { Api, Config } from "datatables.net";
  import type { HTMLAttributes } from "vue";

  defineOptions({ inheritAttrs: false });

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
      data?: readonly T[];
      ajax?: Config["ajax"];
      options?: Config;
      class?: HTMLAttributes["class"];
      renderers?: readonly JsonFormsRendererRegistryEntry[];
      columnOverrides?: SchemaColumnOverrides;
      columnPaths?: readonly string[];
      cellSlots?: SchemaCellSlots;
    }>(),
    {
      options: () => ({}),
      data: () => [],
      class: "nowrap hover order-column row-border stripe display",
      renderers: () => [],
      columnOverrides: () => ({}),
      cellSlots: () => ({}),
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
  const slots = useSlots();

  const model = computed(() => {
    // datatables.net-vue3 replaces named render slots in-place; rebuild fresh
    // column objects whenever the table instance is recreated.
    void instanceKey.value;
    return buildSchemaDatatableModel(props.schema, props.columnOverrides, props.columnPaths);
  });
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

  const toSlotSegment = (segment: string) =>
    segment
      .replace(/^_+/, "")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/[^a-zA-Z0-9-]+/g, "-")
      .toLowerCase();

  const getInternalCellSlotName = (entryIndex: number) => getSchemaCellSlot(entryIndex).slice(1);

  const getAutomaticCellSlotName = (entry: SchemaEntry) =>
    `cell-${entry.dataSegments.map((segment) => toSlotSegment(segment)).join("-")}`;

  const getConfiguredCellSlotName = (entry: SchemaEntry) =>
    props.cellSlots[entry.dataPath] ?? props.cellSlots[entry.schemaPath];

  const automaticCellSlotCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const entry of columnEntries.value) {
      if (getConfiguredCellSlotName(entry)) continue;
      const name = getAutomaticCellSlotName(entry);
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return counts;
  });

  const getCellSlotName = (entry: SchemaEntry) =>
    getConfiguredCellSlotName(entry) ?? getAutomaticCellSlotName(entry);

  const hasCellSlot = (entry: SchemaEntry) => {
    const configuredName = getConfiguredCellSlotName(entry);
    if (configuredName) return Boolean(slots[configuredName]);

    const automaticName = getAutomaticCellSlotName(entry);
    return automaticCellSlotCounts.value.get(automaticName) === 1 && Boolean(slots[automaticName]);
  };

  watchEffect(() => {
    for (const [name, count] of automaticCellSlotCounts.value) {
      if (count > 1 && slots[name]) {
        console.warn(
          `[UiSchemaDatatable] Cell slot "${name}" matches multiple columns; use cellSlots to assign explicit names.`
        );
      }
    }
  });

  const getCellSchema = (entry: SchemaEntry) =>
    attachRootDefinitions(entry.schema, model.value.rootSchema);

  const getCellValue = (rowData: T, entry: SchemaEntry) =>
    getValueAtPath(rowData, entry.dataSegments);

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
    [
      () => props.schema,
      () => props.renderers,
      () => props.columnOverrides,
      () => props.columnPaths,
      () => props.cellSlots,
      () => props.options,
      () => props.ajax,
    ],
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
    v-bind="$attrs"
    data-ui-schema-datatable
    :ajax="ajax"
    :data="data as T[]"
    :columns="columns"
    :class="props.class"
    :options="resolvedOptions"
    @ready="handleReady"
  >
    <template
      v-for="(entry, entryIndex) in columnEntries"
      :key="`${entry.schemaPath}-${entryIndex}`"
      #[getInternalCellSlotName(entryIndex)]="{ colIndex, rowData, rowIndex, type }"
    >
      <slot
        v-if="hasCellSlot(entry)"
        :name="getCellSlotName(entry)"
        :cell-data="getCellValue(rowData as T, entry)"
        :col-index="colIndex"
        :column-entry="entry"
        :column-path="entry.dataPath"
        :row-data="rowData as T"
        :row-index="rowIndex"
        :type="type"
      />
      <SchemaJsonFormsCell
        v-else
        :ajv="ajv"
        :data="getCellValue(rowData as T, entry)"
        :schema="getCellSchema(entry)"
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
