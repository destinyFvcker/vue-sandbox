import type { JsonSchema7 } from "@jsonforms/core";

import complexStruct2Data from "../../rust-schemars-gen/mock/complex_struct_2.json";
import complexStruct2SchemaData from "../../rust-schemars-gen/mock/complex_struct_2.schema.json";
import complexStructData from "../../rust-schemars-gen/mock/complex_struct.json";
import complexStructSchemaData from "../../rust-schemars-gen/mock/complex_struct.schema.json";

export type ComplexStructEnum = string | { bars: number[] } | { foos: number[] };

export interface ComplexStruct {
  myNumber: number;
  myBool: boolean;
  myNullableEnum?: ComplexStructEnum | null;
}

export interface FooStruct {
  foo_foo: number;
  foo_bar: string;
  foo_qux: string;
}

export interface BarStruct {
  bar_foo: number;
  bar_bar: string;
  bar_qux: string;
}

export interface ComplexStruct2 {
  nested_field: {
    foo: FooStruct;
    bar?: BarStruct | null;
  };
  normal_enum: "Foo" | "Bar";
  tuple_enum: unknown;
  struct_enum: unknown;
}

export const complexStructSchema = complexStructSchemaData as unknown as JsonSchema7;
export const complexStruct2Schema = complexStruct2SchemaData as unknown as JsonSchema7;

export const complexStructRows = complexStructData as ComplexStruct[];
export const complexStruct2Rows = complexStruct2Data as ComplexStruct2[];

const repeatRows = <T>(rows: readonly T[], count: number): T[] => {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError("Generated mock row count must be a non-negative integer");
  }
  if (count > 0 && rows.length === 0) {
    throw new RangeError("Cannot repeat an empty generated mock dataset");
  }

  return Array.from({ length: count }, (_, index) => rows[index % rows.length]!);
};

/**
 * Read rows from the committed Rust-generated fixtures. Larger demo data sets
 * repeat those fixtures instead of synthesizing a second, unrelated mock model.
 */
export const createComplexStructRows = (count = complexStructRows.length): ComplexStruct[] =>
  repeatRows(complexStructRows, count);

export const createComplexStruct2Rows = (count = complexStruct2Rows.length): ComplexStruct2[] =>
  repeatRows(complexStruct2Rows, count);

export const withUtilityColumns = (
  schema: JsonSchema7,
  columns: "select" | "action" | "select-and-action"
): JsonSchema7 => {
  const utilityProperties: Record<string, unknown> = {};
  if (columns === "select" || columns === "select-and-action") {
    utilityProperties.__select = { type: "boolean", title: "", readOnly: true };
  }
  if (columns === "action" || columns === "select-and-action") {
    utilityProperties.actions = { type: "string", title: "Action", readOnly: true };
  }

  return {
    ...schema,
    properties: {
      ...utilityProperties,
      ...(schema.properties ?? {}),
    },
  } as unknown as JsonSchema7;
};
