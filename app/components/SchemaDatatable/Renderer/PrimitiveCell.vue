<script setup lang="ts">
  import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
  import type { ControlElement } from "@jsonforms/core";

  const props = defineProps({
    ...rendererProps<ControlElement>(),
  });

  const { control } = useJsonFormsControl(props);

  const schemaType = computed(() => control.value.schema.type);
  const isBoolean = computed(() => schemaType.value === "boolean");
  const isNumber = computed(() => schemaType.value === "number" || schemaType.value === "integer");
  const text = computed(() => {
    const value = control.value.data;
    if (value == null) return "—";

    if (isNumber.value) {
      const number = Number(value);
      return Number.isFinite(number)
        ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 20 }).format(number)
        : String(value);
    }

    return String(value);
  });
</script>

<template>
  <span v-if="control.data == null" class="text-muted-foreground">—</span>
  <span v-else-if="isBoolean" class="inline-flex items-center gap-1.5 whitespace-nowrap">
    <span
      class="inline-flex size-4 items-center justify-center rounded-full text-[10px] font-bold"
      :class="control.data ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'"
      aria-hidden="true"
    >
      {{ control.data ? "✓" : "×" }}
    </span>
    {{ String(control.data) }}
  </span>
  <span v-else :class="isNumber ? 'font-mono tabular-nums' : ''">{{ text }}</span>
</template>
