<script setup lang="ts">
  import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
  import type { ControlElement } from "@jsonforms/core";

  const props = defineProps({
    ...rendererProps<ControlElement>(),
  });

  const { control } = useJsonFormsControl(props);
  const text = computed(() => {
    const value = control.value.data;
    if (value == null) return "—";
    if (typeof value !== "object") return String(value);

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  });
</script>

<template>
  <span :class="control.data == null ? 'text-muted-foreground' : 'font-mono text-xs'">
    {{ text }}
  </span>
</template>
