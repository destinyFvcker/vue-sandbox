<script setup lang="ts">
import { type ControlElement } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import { CircleCheck, CircleX } from "@lucide/vue";

const props = defineProps({
	...rendererProps<ControlElement>(),
});

const { control } = useJsonFormsControl(props);
</script>

<template>
	<div class="flex justify-center">
		<div class="flex items-center gap-2">
			<CircleCheck v-if="control.data" class="size-4" />
			<CircleX v-else class="size-4" />
			{{ String(control.data) }}
		</div>
	</div>
</template>
