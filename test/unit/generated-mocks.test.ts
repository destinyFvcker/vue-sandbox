import { describe, expect, it } from "vitest";

import {
  complexStruct2ColumnPaths,
  complexStruct2Schema,
  complexStructColumnPaths,
  complexStructSchema,
} from "../../app/lib/datatable-example-schemas";
import {
  complexStruct2Rows,
  complexStructRows,
  createComplexStruct2Rows,
  createComplexStructRows,
} from "../../app/lib/generated-mocks";
import { buildSchemaDatatableModel } from "../../app/lib/schema-datatable";

describe("Rust-generated mock fixtures", () => {
  it("exposes both generated schemas with their matching rows", () => {
    expect(complexStructSchema.title).toBe("ComplexStruct");
    expect(complexStruct2Schema.title).toBe("ComplexStruct2");
    expect(complexStructRows).toHaveLength(100);
    expect(complexStruct2Rows).toHaveLength(100);
    expect(createComplexStructRows(2)).toEqual(complexStructRows.slice(0, 2));
    expect(createComplexStruct2Rows(2)).toEqual(complexStruct2Rows.slice(0, 2));
  });

  it("projects only formats that the table can display consistently", () => {
    const complexModel = buildSchemaDatatableModel(
      complexStructSchema,
      undefined,
      complexStructColumnPaths
    );
    const nestedModel = buildSchemaDatatableModel(
      complexStruct2Schema,
      undefined,
      complexStruct2ColumnPaths.nested
    );

    expect(complexModel.columnEntries.map((entry) => entry.dataPath)).toEqual([
      "myNumber",
      "myBool",
    ]);
    expect(nestedModel.columnEntries.map((entry) => entry.dataPath)).not.toEqual(
      expect.arrayContaining(["tuple_enum", "struct_enum"])
    );
    expect(
      nestedModel.columnEntries.every((entry) =>
        complexStruct2Rows.every((row) => {
          let value: unknown = row;
          for (const segment of entry.dataSegments) {
            if (value == null) return true;
            if (typeof value !== "object") return false;
            value = (value as Record<string, unknown>)[segment];
          }
          return value == null || ["string", "number", "boolean"].includes(typeof value);
        })
      )
    ).toBe(true);
  });

  it("rejects invalid repeat counts", () => {
    expect(() => createComplexStructRows(-1)).toThrow(RangeError);
    expect(() => createComplexStruct2Rows(1.5)).toThrow(RangeError);
  });
});
