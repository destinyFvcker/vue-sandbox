import {
	isAnyOfControl,
	isBooleanControl,
	isIntegerControl,
	isLayout,
	isNumberControl,
	isOneOfControl,
	isStringControl,
	or,
	rankWith,
	type JsonFormsRendererRegistryEntry,
} from "@jsonforms/core";
import StringRenderer from "./StringRenderer.vue";
import NumberRenderer from "./NumberRenderer.vue";
import BooleanRenderer from "./BooleanRenderer.vue";
import LayoutCell from "./LayoutCell.vue";
import AnyOfRenderer from "./AnyOfRenderer.vue";
import OneOfRenderer from "./OneOfRenderer.vue";

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
		renderer: BooleanRenderer,
		tester: rankWith(10, isBooleanControl),
	},
	{
		renderer: LayoutCell,
		tester: rankWith(10, isLayout),
	},
	{
		renderer: AnyOfRenderer,
		tester: rankWith(10, isAnyOfControl),
	},
	{
		renderer: OneOfRenderer,
		tester: rankWith(10, isOneOfControl),
	},
];
