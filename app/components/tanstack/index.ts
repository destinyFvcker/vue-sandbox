import {
	isIntegerControl,
	isLayout,
	isNumberControl,
	isStringControl,
	or,
	rankWith,
	type JsonFormsRendererRegistryEntry,
} from "@jsonforms/core";
import StringRenderer from "./StringRenderer.vue";
import NumberRenderer from "./NumberRenderer.vue";
import LayoutCell from "./LayoutCell.vue";

export const tanstackRenderers: JsonFormsRendererRegistryEntry[] = [
	{
		renderer: StringRenderer,
		tester: rankWith(10, isStringControl),
	},
	{
		renderer: NumberRenderer,
		tester: rankWith(10, or(isNumberControl, isIntegerControl)),
	},
	{
		renderer: LayoutCell,
		tester: rankWith(10, isLayout),
	},
];
