<script setup lang="ts">
  import { createCombinatorRenderInfos } from "@jsonforms/core";
  import { DispatchRenderer, rendererProps, useJsonFormsOneOfControl } from "@jsonforms/vue";
  import type { ControlElement } from "@jsonforms/core";

  const props = defineProps({
    ...rendererProps<ControlElement>(),
  });

  const { control } = useJsonFormsOneOfControl(props);
  const selectedIndex = computed(() => control.value.indexOfFittingSchema ?? 0);
  const selectedRenderer = computed(() => {
    const infos = createCombinatorRenderInfos(
      control.value.schema.oneOf ?? [],
      control.value.rootSchema,
      "oneOf",
      control.value.uischema,
      control.value.path,
      control.value.uischemas
    );
    return infos[selectedIndex.value];
  });
</script>

<template>
  <span v-if="control.data == null" class="text-muted-foreground">—</span>
  <DispatchRenderer
    v-else-if="selectedRenderer"
    :schema="selectedRenderer.schema"
    :uischema="selectedRenderer.uischema"
    :path="control.path"
    :renderers="control.renderers"
    :cells="control.cells"
    :enabled="control.enabled"
    :readonly="true"
  />
  <span v-else>{{ String(control.data) }}</span>
</template>
