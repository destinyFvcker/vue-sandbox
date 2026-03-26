<script setup lang="ts">
  defineProps<{
    label?: string;
  }>();
</script>

<template>
  <span class="text-muted-foreground italic">{{ label ?? "N/A" }}</span>
</template>
