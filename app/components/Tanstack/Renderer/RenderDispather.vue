<script setup lang="ts">
  import { rendererProps, useJsonFormsRenderer } from "@jsonforms/vue";
  import maxBy from "lodash/maxBy";

  import FallbackRenderer from "./Fallback.vue";

  const props = defineProps({
    ...rendererProps(),
  });
  const { renderer: rendererState, rootSchema } = useJsonFormsRenderer(props);

  const determinedRenderer = computed(() => {
    const testerContext = {
      rootSchema: rootSchema.value,
      config: rendererState.value.config,
    };
    const renderer = maxBy(rendererState.value.renderers, (r) =>
      r.tester(rendererState.value.uischema, rendererState.value.schema, testerContext)
    );
    const rendererScore =
      renderer?.tester(rendererState.value.uischema, rendererState.value.schema, testerContext) ??
      -1;
    if (renderer === undefined || rendererScore === -1) {
      return FallbackRenderer;
    } else {
      return renderer.renderer;
    }
  });
</script>

<template>
  <component :is="determinedRenderer" v-bind="rendererState">
    <!-- Forward all slots dynamically -->
    <!-- 这实际上就是vue之中为具名插槽传递数据的一种写法 -->
    <template v-for="(_, slotName) in $slots" :key="slotName" #[slotName]>
      <slot :name="slotName"></slot>
    </template>
  </component>
</template>
