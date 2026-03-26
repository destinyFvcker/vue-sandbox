import { describe, expect, it, vi } from "vitest";
import type { JsonSchema7 } from "@jsonforms/core";

import { getColumnSchema } from "../../app/components/tanstack/genColumnDef";

vi.mock("@tanstack/vue-table", () => ({
  createColumnHelper: () => ({ accessor: vi.fn() }),
}));

const objectSchema: JsonSchema7 = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" },
    tags: { type: "array", items: { type: "string" } },
  },
};

describe("getColumnSchema", () => {
  it("返回已知字段的子 Schema", () => {
    expect(getColumnSchema(objectSchema, "name")).toEqual({ type: "string" });
    expect(getColumnSchema(objectSchema, "age")).toEqual({ type: "number" });
  });

  it("返回数组类型字段的子 Schema", () => {
    expect(getColumnSchema(objectSchema, "tags")).toEqual({
      type: "array",
      items: { type: "string" },
    });
  });

  it("字段不存在时回退返回原始 schema", () => {
    expect(getColumnSchema(objectSchema, "nonExistent")).toBe(objectSchema);
  });

  it("column 为空字符串时回退返回原始 schema", () => {
    expect(getColumnSchema(objectSchema, "")).toBe(objectSchema);
  });

  it("原始类型 schema 直接返回自身", () => {
    const primitiveSchema: JsonSchema7 = { type: "string" };
    expect(getColumnSchema(primitiveSchema, "name")).toBe(primitiveSchema);
  });

  it("schema 没有 properties 时回退返回原始 schema", () => {
    const noPropsSchema: JsonSchema7 = { type: "object" };
    expect(getColumnSchema(noPropsSchema, "name")).toBe(noPropsSchema);
  });
});
