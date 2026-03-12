<script setup lang="ts">
import { defineComponent } from "vue";
import FallbackRenderer from "./FallbackRenderer.vue";
import maxBy from "lodash/maxBy";
import { rendererProps, useJsonFormsRenderer } from "@jsonforms/vue";

// export default defineComponent({
// 	name: "DispatchRenderer",
// 	props: {
// 		...rendererProps(),
// 	},
// 	setup(props) {
// 		return useJsonFormsRenderer(props);
// 	},
// 	computed: {
// 		determinedRenderer(): any {
// 			const testerContext = {
// 				rootSchema: this.rootSchema,
// 				config: this.config,
// 			};
// 			const renderer = maxBy(this.renderer.renderers, (r) =>
// 				r.tester(this.renderer.uischema, this.renderer.schema, testerContext),
// 			);
// 			if (
// 				renderer === undefined ||
// 				renderer.tester(this.renderer.uischema, this.renderer.schema, testerContext) === -1
// 			) {
// 				return UnknownRenderer;
// 			} else {
// 				return renderer.renderer;
// 			}
// 		},
// 	},
// });

let props = defineProps({
	...rendererProps(),
});
const { renderer: rendererState, rootSchema } = useJsonFormsRenderer(props);

const determinedRenderer = computed(() => {
	const testerContext = {
		rootSchema: rootSchema.value,
		config: rendererState.value.config,
	};
	const renderer = maxBy(rendererState.value.renderers, (r) =>
		r.tester(rendererState.value.uischema, rendererState.value.schema, testerContext),
	);
	if (
		renderer === undefined ||
		renderer.tester(rendererState.value.uischema, rendererState.value.schema, testerContext) === -1
	) {
		return FallbackRenderer;
	} else {
		return renderer.renderer;
	}
});
</script>

<template>
	<component :is="determinedRenderer" v-bind="rendererState">
		<!-- Forward all slots dynamically -->
		<!-- 这实际上就是vue之中为具名插槽传递数据的一种写法 -->
		<template v-for="(_, slotName) in $slots" :key="slotName" #[slotName]>
			<slot :name="slotName"></slot>
		</template>
	</component>
</template>
