<script setup lang="ts">
import { type ControlElement } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

const props = defineProps({
	...rendererProps<ControlElement>(),
});

const { control } = useJsonFormsControl(props);
</script>

<template>
	<div class="flex justify-center">
		<div class="text-center">{{ control.data as string }}</div>
	</div>
</template>
