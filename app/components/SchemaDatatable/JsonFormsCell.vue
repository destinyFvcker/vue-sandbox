<script setup lang="ts">
  import { Generate } from "@jsonforms/core";
  import { JsonForms } from "@jsonforms/vue";
  import { markRaw } from "vue";
  import type { JsonFormsRendererRegistryEntry, JsonSchema } from "@jsonforms/core";
  import type { SchemaDatatableAjv } from "~/lib/schema-datatable";

  import { schemaDatatableRenderers } from "./Renderer";

  const props = withDefaults(
    defineProps<{
      ajv: SchemaDatatableAjv;
      data?: unknown;
      schema: JsonSchema;
      renderers?: readonly JsonFormsRendererRegistryEntry[];
    }>(),
    {
      data: undefined,
      renderers: () => [],
    }
  );

  const uischema = Generate.controlElement("#");
  const combinedRenderers = computed(() =>
    [...props.renderers, ...schemaDatatableRenderers].map((entry) => ({
      ...entry,
      renderer: markRaw(entry.renderer),
    }))
  );
</script>

<template>
  <JsonForms
    :ajv="ajv"
    :data="data"
    :schema="schema"
    :uischema="uischema"
    :renderers="combinedRenderers"
    :readonly="true"
    validation-mode="NoValidation"
  />
</template>
