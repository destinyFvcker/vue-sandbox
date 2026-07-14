<script setup lang="ts">
  import { getValueAtPath, humanizePropertyName } from "~/lib/schema-resolver";
  import type { SchemaEntry } from "~/lib/schema-resolver";

  const props = defineProps<{
    arrayEntries: SchemaEntry[];
    expandedRows: Map<number, unknown>;
    rowData: Record<string, unknown>;
    rowIndex: number;
  }>();

  const emit = defineEmits<{
    toggle: [rowIndex: number, rowData: Record<string, unknown>];
  }>();

  const expanded = computed(() => props.expandedRows.has(props.rowIndex));
  const counts = computed(() =>
    props.arrayEntries.map((entry) => {
      const value = getValueAtPath(props.rowData, entry.dataSegments);
      return {
        label: humanizePropertyName(entry.dataSegments.at(-1) ?? entry.dataPath),
        value: Array.isArray(value) ? value.length : 0,
      };
    })
  );
</script>

<template>
  <button
    type="button"
    class="hover:bg-muted focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-md p-1 text-xs focus-visible:ring-2 focus-visible:outline-none"
    :aria-expanded="expanded"
    :aria-label="expanded ? 'Collapse row details' : 'Expand row details'"
    @click.stop="emit('toggle', rowIndex, rowData)"
  >
    <span
      aria-hidden="true"
      class="text-muted-foreground inline-block transition-transform"
      :class="expanded ? 'rotate-90' : ''"
    >
      ▶
    </span>
    <span
      v-for="count in counts"
      :key="count.label"
      class="bg-muted text-muted-foreground rounded px-1.5 py-0.5 whitespace-nowrap"
    >
      {{ count.label }}: {{ count.value }}
    </span>
  </button>
</template>
