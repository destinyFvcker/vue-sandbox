<script setup lang="ts">
  import {
    collectSchemaEntries,
    getValueAtPath,
    humanizePropertyName,
    resolveArrayItemSchema,
  } from "~/lib/schema-resolver";
  import type { JsonFormsRendererRegistryEntry, JsonSchema } from "@jsonforms/core";
  import type { SchemaDatatableAjv } from "~/lib/schema-datatable";
  import type { SchemaEntry } from "~/lib/schema-resolver";
  import type { Config } from "datatables.net";
  import type { Component } from "vue";

  const props = withDefaults(
    defineProps<{
      ajv: SchemaDatatableAjv;
      arrayEntries: SchemaEntry[];
      renderers?: readonly JsonFormsRendererRegistryEntry[];
      rootSchema: JsonSchema;
      rowData: Record<string, unknown>;
      tableComponent: Component;
    }>(),
    {
      renderers: () => [],
    }
  );

  const activePath = ref(props.arrayEntries[0]?.dataPath ?? "");

  watch(
    () => props.arrayEntries,
    (entries) => {
      if (!entries.some((entry) => entry.dataPath === activePath.value)) {
        activePath.value = entries[0]?.dataPath ?? "";
      }
    }
  );

  const nestedOptions: Config = {
    info: false,
    lengthChange: false,
    ordering: true,
    paging: false,
    responsive: false,
    searching: false,
    layout: {
      topStart: null,
      topEnd: null,
      bottomStart: null,
      bottomEnd: null,
    },
  };

  const panels = computed(() =>
    props.arrayEntries.map((entry) => {
      const rawValue = getValueAtPath(props.rowData, entry.dataSegments);
      const values = Array.isArray(rawValue) ? rawValue : [];
      const itemSchema = resolveArrayItemSchema(entry.schema, props.rootSchema);
      const objectLike =
        itemSchema.type === "object" || collectSchemaEntries(itemSchema, itemSchema).length > 0;

      return {
        data: objectLike
          ? values.filter(
              (value): value is Record<string, unknown> =>
                value !== null && typeof value === "object" && !Array.isArray(value)
            )
          : values.map((value) => ({ value })),
        label:
          typeof entry.schema.title === "string"
            ? entry.schema.title
            : humanizePropertyName(entry.dataSegments.at(-1) ?? entry.dataPath),
        path: entry.dataPath,
        schema: objectLike
          ? itemSchema
          : ({
              type: "object",
              properties: {
                value: {
                  ...itemSchema,
                  title: typeof itemSchema.title === "string" ? itemSchema.title : "Value",
                },
              },
            } satisfies JsonSchema),
      };
    })
  );
</script>

<template>
  <section class="bg-muted/25 border-t p-3" aria-label="Row array details">
    <div
      v-if="panels.length > 1"
      class="bg-background mb-3 inline-flex flex-wrap gap-1 rounded-lg border p-1"
      role="tablist"
      aria-label="Array fields"
    >
      <button
        v-for="panel in panels"
        :id="`schema-tab-${panel.path}`"
        :key="panel.path"
        type="button"
        role="tab"
        class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
        :class="activePath === panel.path ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'"
        :aria-selected="activePath === panel.path"
        @click="activePath = panel.path"
      >
        {{ panel.label }} ({{ panel.data.length }})
      </button>
    </div>

    <template v-for="panel in panels" :key="panel.path">
      <div
        v-if="activePath === panel.path"
        role="tabpanel"
        :aria-labelledby="panels.length > 1 ? `schema-tab-${panel.path}` : undefined"
      >
        <h3 v-if="panels.length === 1" class="mb-2 text-sm font-medium">
          {{ panel.label }} ({{ panel.data.length }})
        </h3>
        <p v-if="panel.data.length === 0" class="text-muted-foreground py-4 text-center text-sm">
          No data
        </p>
        <component
          :is="tableComponent"
          v-else
          :ajv="ajv"
          :schema="panel.schema"
          :data="panel.data"
          :renderers="renderers"
          :options="nestedOptions"
          class="compact row-border"
        />
      </div>
    </template>
  </section>
</template>
