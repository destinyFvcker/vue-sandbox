import { describe, expect, it, vi } from "vitest";
import type { JsonSchema } from "@jsonforms/core";
import type { ConfigColumns, FunctionColumnRender } from "datatables.net";

import { buildSchemaDatatableModel, renderSchemaValue } from "../../app/lib/schema-datatable";

const readColumn = (column: ConfigColumns, row: Record<string, unknown>): unknown => {
  if (typeof column.data === "function") {
    return column.data(row, "display", undefined, { row: 0, col: 0, settings: {} as never });
  }

  if (typeof column.data !== "string") return row;
  return column.data.split(".").reduce<unknown>((value, segment) => {
    if (value === null || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[segment];
  }, row);
};

const renderColumn = (
  column: ConfigColumns,
  type: string,
  row: Record<string, unknown>
): unknown => {
  const value = readColumn(column, row);
  const render = column.render as FunctionColumnRender | undefined;
  return render?.(value, type, row, { row: 0, col: 0, settings: {} as never }) ?? value;
};

describe("schema DataTable config compiler", () => {
  const schema: JsonSchema = {
    type: "object",
    properties: {
      id: { type: "integer", title: "Identifier" },
      profile: {
        type: "object",
        properties: { displayName: { type: "string" } },
      },
      enabled: { type: "boolean" },
      note: { type: ["string", "null"] },
      tags: { type: "array", items: { type: "string" } },
    },
  };

  it("compiles scalar leaves to native DataTables paths and ignores arrays by default", () => {
    const model = buildSchemaDatatableModel(schema);

    expect(model.columns).toHaveLength(4);
    expect(model.columns[0]).toMatchObject({
      title: "Identifier",
      name: "id",
      data: "id",
      defaultContent: "",
    });
    expect(model.columns[1]).toMatchObject({
      title: "Display Name",
      name: "profile.displayName",
      data: "profile.displayName",
      defaultContent: "",
    });
    expect(model.columns.map((column) => column.name)).not.toContain("tags");
    expect(JSON.stringify(model.columns)).not.toContain("#schema-");
  });

  it("escapes display strings while preserving primitive search and sort values", () => {
    const model = buildSchemaDatatableModel(schema);
    const row = {
      id: 12.5,
      profile: { displayName: '<img src=x onerror="alert(1)">' },
      enabled: false,
      note: null,
      tags: [],
    };
    const [id, displayName, enabled, note] = model.columns;

    expect(renderColumn(displayName!, "display", row)).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
    expect(renderColumn(displayName!, "filter", row)).toBe('<img src=x onerror="alert(1)">');
    expect(renderColumn(id!, "sort", row)).toBe(12.5);
    expect(renderColumn(enabled!, "filter", row)).toBe(false);
    expect(renderColumn(enabled!, "sort", row)).toBe(false);
    expect(renderColumn(note!, "display", row)).toBe("");
    expect(renderColumn(note!, "sort", row)).toBeNull();
  });

  it("uses a precompiled accessor for DataTables-special property names", () => {
    const dottedSchema: JsonSchema = {
      type: "object",
      properties: {
        "first.name": { type: "string" },
        "labels[0]": { type: "string" },
      },
    };
    const model = buildSchemaDatatableModel(dottedSchema, {
      "#/properties/first.name": { title: "Exact name" },
    });
    const row = { "first.name": "Ada", "labels[0]": "primary" };

    expect(model.columns[0]!.title).toBe("Exact name");
    expect(model.columns.every((column) => typeof column.data === "function")).toBe(true);
    expect(readColumn(model.columns[0]!, row)).toBe("Ada");
    expect(readColumn(model.columns[1]!, row)).toBe("primary");
  });

  it("escapes schema-derived titles while leaving explicit DataTables overrides in control", () => {
    const unsafeTitleSchema: JsonSchema = {
      type: "object",
      properties: {
        name: { type: "string", title: '<img src=x onerror="alert(1)">' },
      },
    };

    expect(buildSchemaDatatableModel(unsafeTitleSchema).columns[0]!.title).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
    expect(
      buildSchemaDatatableModel(unsafeTitleSchema, { name: { title: "<strong>Name</strong>" } })
        .columns[0]!.title
    ).toBe("<strong>Name</strong>");
  });

  it("projects and reorders paths, including explicitly requested arrays", () => {
    const model = buildSchemaDatatableModel(schema, undefined, [
      "profile.displayName",
      "tags",
      "id",
    ]);
    const row = {
      id: 1,
      profile: { displayName: "Ada" },
      tags: ["safe", "<unsafe>"],
    };

    expect(model.columns.map((column) => column.name)).toEqual([
      "profile.displayName",
      "tags",
      "id",
    ]);
    expect(model.columnEntries.map((entry) => entry.dataPath)).toEqual([
      "profile.displayName",
      "tags",
      "id",
    ]);
    expect(renderColumn(model.columns[1]!, "filter", row)).toBe('["safe","<unsafe>"]');
    expect(renderColumn(model.columns[1]!, "display", row)).toBe(
      "[&quot;safe&quot;,&quot;&lt;unsafe&gt;&quot;]"
    );
  });

  it("gives override renderers resolved cell data and keeps structural mappings compiler-owned", () => {
    const customRenderer = vi.fn((value: unknown, type: string, row: unknown) =>
      type === "display" ? `ID ${value}` : (row as { id: number }).id
    );
    const overrides = {
      id: {
        title: "Custom ID",
        visible: false,
        width: "8rem",
        data: "profile.displayName",
        name: "hijacked",
        render: customRenderer,
      },
    } as unknown as Parameters<typeof buildSchemaDatatableModel>[1];
    const model = buildSchemaDatatableModel(schema, overrides);
    const row = { id: 7, profile: { displayName: "Ada" } };

    expect(model.columns[0]).toMatchObject({
      title: "Custom ID",
      visible: false,
      width: "8rem",
      data: "id",
      name: "id",
    });
    expect(renderColumn(model.columns[0]!, "display", row)).toBe("ID 7");
    expect(customRenderer).toHaveBeenCalledWith(
      7,
      "display",
      row,
      expect.objectContaining({ row: 0, col: 0 })
    );
  });

  it("resolves $ref and allOf fields into native columns", () => {
    const referencedSchema: JsonSchema = {
      type: "object",
      properties: {
        profile: { $ref: "#/$defs/Profile" },
      },
      $defs: {
        Base: {
          type: "object",
          properties: { name: { type: "string", title: "Customer" } },
        },
        Profile: {
          allOf: [
            { $ref: "#/$defs/Base" },
            { type: "object", properties: { region: { type: "string" } } },
          ],
        },
      },
    };

    expect(buildSchemaDatatableModel(referencedSchema).columns).toMatchObject([
      { title: "Customer", data: "profile.name", name: "profile.name" },
      { title: "Region", data: "profile.region", name: "profile.region" },
    ]);
  });

  it("collects oneOf and anyOf object fields without duplicate columns", () => {
    const variantSchema: JsonSchema = {
      type: "object",
      oneOf: [
        { type: "object", properties: { shared: { type: "string" }, left: { type: "number" } } },
        { type: "object", properties: { shared: { type: "integer" }, right: { type: "boolean" } } },
      ],
      anyOf: [
        { type: "object", properties: { extra: { type: "string" } } },
        { type: "object", properties: { extra: { type: "null" } } },
      ],
    };
    const model = buildSchemaDatatableModel(variantSchema);

    expect(model.columns.map((column) => column.name)).toEqual([
      "shared",
      "left",
      "right",
      "extra",
    ]);
    expect(model.columnEntries.find((entry) => entry.dataPath === "shared")?.schema).toHaveProperty(
      "anyOf"
    );
  });

  it("keeps schema descriptions as metadata only", () => {
    const describedSchema: JsonSchema = {
      type: "object",
      properties: {
        code: { type: "string", title: "Code", description: "Internal-only explanation" },
      },
    };
    const model = buildSchemaDatatableModel(describedSchema);

    expect(model.columnEntries[0]!.schema.description).toBe("Internal-only explanation");
    expect(model.columns[0]).not.toHaveProperty("description");
    expect(model.columns[0]).not.toHaveProperty("ariaTitle");
  });

  it("normalizes a top-level array schema and rejects unknown projections", () => {
    const arraySchema: JsonSchema = { type: "array", items: schema };
    expect(buildSchemaDatatableModel(arraySchema).columns[0]).toMatchObject({ data: "id" });
    expect(() => buildSchemaDatatableModel(schema, undefined, ["missing"])).toThrow(
      "Unknown column path: missing"
    );
  });

  it("renders circular composite values without throwing", () => {
    const value: Record<string, unknown> = {};
    value.self = value;
    expect(renderSchemaValue(value, "display")).toBe("[object Object]");
  });
});
