<script setup lang="ts">
  defineProps<{
    label?: string;
  }>();
</script>

<template>
  <div class="text-muted-foreground text-center italic">{{ label ?? "N/A" }}</div>
</template>
