<script setup lang="ts">
const props = defineProps<{
	header: string;
	description: string;
}>();
</script>

<template>
	<TooltipProvider>
		<Tooltip>
			<TooltipTrigger class="flex w-fit justify-center">
				<div class="text-center underline decoration-dashed underline-offset-4">{{ header }}</div>
			</TooltipTrigger>
			<TooltipContent>
				<p>{{ description }}</p>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
</template>
