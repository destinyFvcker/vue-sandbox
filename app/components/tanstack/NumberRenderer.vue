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
		return "";
	}
	if (Number.isInteger(v)) {
		return v.toString();
	} else {
		return v.toFixed(2);
	}
});
</script>

<template>
	<div class="flex justify-center">
		<div class="text-right font-mono">{{ display }}</div>
	</div>
</template>
