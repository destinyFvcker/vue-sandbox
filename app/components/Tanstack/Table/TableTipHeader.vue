<script setup lang="ts">
  const _ = defineProps<{
    header: string;
    description: string;
  }>();
</script>

<template>
  <UiTooltipProvider>
    <UiTooltip>
      <UiTooltipTrigger class="flex w-fit justify-center">
        <div class="text-center underline decoration-dashed underline-offset-4">{{ header }}</div>
      </UiTooltipTrigger>
      <UiTooltipContent>
        <p>{{ description }}</p>
      </UiTooltipContent>
    </UiTooltip>
  </UiTooltipProvider>
</template>
