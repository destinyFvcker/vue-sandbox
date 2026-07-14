<script setup lang="ts" generic="T extends Record<string, any>">
  import { buildSchemaDatatableModel } from "~/lib/schema-datatable";
  import type { JsonSchema } from "@jsonforms/core";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Api, Config } from "datatables.net";
  import type { HTMLAttributes } from "vue";

  defineOptions({ inheritAttrs: false });

  const props = withDefaults(
    defineProps<{
      schema: JsonSchema;
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

  const tableApi = shallowRef<Api<T>>();
  const instanceKey = ref(0);

  // Deliberately excludes row data: a schema/config revision is compiled once,
  // while DataTables handles data refreshes without revisiting the schema.
  const model = computed(() =>
    buildSchemaDatatableModel(props.schema, props.columnOverrides, props.columnPaths)
  );
  const columns = computed(() => model.value.columns);
  const columnEntries = computed(() => model.value.columnEntries);
  const config = computed<Config>(() => ({
    ...props.options,
    columns: columns.value,
  }));

  const handleReady = (api: Api<Record<string, any>> | undefined) => {
    const typedApi = api as unknown as Api<T> | undefined;
    tableApi.value = typedApi;
    emit("ready", typedApi);
  };

  watch(
    [
      () => props.schema,
      () => props.columnOverrides,
      () => props.columnPaths,
      () => props.options,
      () => props.ajax,
    ],
    () => {
      tableApi.value = undefined;
      instanceKey.value += 1;
    },
    { deep: true, flush: "sync" }
  );

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
</template>
