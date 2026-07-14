import {
  isAnyOfControl,
  isBooleanControl,
  isIntegerControl,
  isNumberControl,
  isOneOfControl,
  isStringControl,
  or,
  rankWith,
} from "@jsonforms/core";
import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core";

import AnyOfCell from "./AnyOfCell.vue";
import FallbackCell from "./FallbackCell.vue";
import OneOfCell from "./OneOfCell.vue";
import PrimitiveCell from "./PrimitiveCell.vue";

export const schemaDatatableRenderers: JsonFormsRendererRegistryEntry[] = [
  { tester: rankWith(3, isOneOfControl), renderer: OneOfCell },
  { tester: rankWith(3, isAnyOfControl), renderer: AnyOfCell },
  {
    tester: rankWith(2, or(isNumberControl, isIntegerControl, isBooleanControl, isStringControl)),
    renderer: PrimitiveCell,
  },
  { tester: rankWith(0, () => true), renderer: FallbackCell },
];
