<script setup lang="ts">
  import { type ControlElement } from "@jsonforms/core";
  import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

  const props = defineProps({
    ...rendererProps<ControlElement>(),
  });

  const { control } = useJsonFormsControl(props);

  const display = computed(() => {
    const v = Number(control.value.data);
    if (Number.isNaN(v)) {
      return "NaN";
    }
    if (Number.isInteger(v)) {
      return v.toLocaleString("en-US");
    } else {
      return v.toFixed(2);
    }
  });
</script>

<template>
  <div class="flex justify-end px-2">
    <div class="text-right font-mono text-xs">{{ display }}</div>
  </div>
</template>
