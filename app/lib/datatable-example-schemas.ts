import { complexStruct2Schema, complexStructSchema, withUtilityColumns } from "./generated-mocks";

export { complexStruct2Schema, complexStructSchema };

export const selectableComplexStruct2Schema = withUtilityColumns(complexStruct2Schema, "select");
export const actionableComplexStruct2Schema = withUtilityColumns(complexStruct2Schema, "action");

export const complexStructColumnPaths = ["myNumber", "myBool"] as const;

export const complexStruct2ColumnPaths = {
  compact: [
    "nested_field.foo.foo_foo",
    "nested_field.foo.foo_bar",
    "nested_field.foo.foo_qux",
    "normal_enum",
  ],
  nested: [
    "nested_field.foo.foo_foo",
    "nested_field.foo.foo_bar",
    "nested_field.foo.foo_qux",
    "nested_field.bar.bar_foo",
    "nested_field.bar.bar_bar",
    "nested_field.bar.bar_qux",
    "normal_enum",
  ],
  selectable: [
    "__select",
    "nested_field.foo.foo_foo",
    "nested_field.foo.foo_bar",
    "nested_field.foo.foo_qux",
    "normal_enum",
  ],
  selectableNested: [
    "__select",
    "nested_field.foo.foo_foo",
    "nested_field.foo.foo_bar",
    "nested_field.foo.foo_qux",
    "nested_field.bar.bar_foo",
    "nested_field.bar.bar_bar",
    "nested_field.bar.bar_qux",
    "normal_enum",
  ],
  actionable: [
    "__action",
    "nested_field.foo.foo_foo",
    "nested_field.foo.foo_bar",
    "nested_field.foo.foo_qux",
    "normal_enum",
  ],
} as const;
