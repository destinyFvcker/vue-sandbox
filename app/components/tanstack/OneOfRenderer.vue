<script setup lang="ts">
import { createCombinatorRenderInfos, type ControlElement } from "@jsonforms/core";
import { DispatchRenderer, rendererProps, useJsonFormsOneOfControl } from "@jsonforms/vue";
import { computed } from "vue";

const props = defineProps({
	...rendererProps<ControlElement>(),
});

const { control } = useJsonFormsOneOfControl(props);

const selectedIndex = computed(() => control.value.indexOfFittingSchema ?? 0);

const oneOfRenderInfos = computed(() => {
	return createCombinatorRenderInfos(
		control.value.schema.oneOf!,
		control.value.rootSchema,
		"oneOf",
		control.value.uischema,
		control.value.path,
		control.value.uischemas,
	);
});

const matchedRenderInfo = computed(() => oneOfRenderInfos.value[selectedIndex.value]);
</script>

<template>
	<div v-if="control.data == null" class="text-muted-foreground text-center">-</div>
	<DispatchRenderer
		v-else-if="matchedRenderInfo?.uischema"
		:schema="matchedRenderInfo.schema"
		:uischema="matchedRenderInfo.uischema"
		:path="control.path"
		:renderers="control.renderers"
		:cells="control.cells"
		:enabled="control.enabled"
	/>
	<div v-else class="text-muted-foreground text-center">{{ control.data }}</div>
</template>
