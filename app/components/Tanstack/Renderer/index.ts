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
} from "@jsonforms/core";
import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core";

import AnyOfRenderer from "./AnyOf.vue";
import BooleanRenderer from "./Boolean.vue";
import LayoutCell from "./LayoutCell.vue";
import NumberRenderer from "./Number.vue";
import OneOfRenderer from "./OneOf.vue";
import StringRenderer from "./String.vue";

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
