import { describe, expect, it } from "vitest";
import type { JsonSchema } from "@jsonforms/core";
import type { ObjectColumnRender } from "datatables.net";

import {
  buildSchemaDatatableModel,
  getSchemaCellSlot,
  SCHEMA_EXPAND_SLOT,
} from "../../app/lib/schema-datatable";

const invokeRenderer = (
  render: ObjectColumnRender | undefined,
  key: keyof ObjectColumnRender,
  row: Record<string, unknown>
) => {
  const renderer = render?.[key];
  if (typeof renderer !== "function") return renderer;
  return renderer(null, String(key), row, { row: 0, col: 0, settings: {} as never });
};

describe("schema DataTable adapter", () => {
  const schema: JsonSchema = {
    type: "object",
    properties: {
      id: { type: "integer", title: "Identifier" },
      profile: {
        type: "object",
        properties: { displayName: { type: "string" } },
      },
      enabled: { type: "boolean" },
      tags: { type: "array", items: { type: "string" } },
    },
  };

  it("builds an expansion column and schema display columns", () => {
    const model = buildSchemaDatatableModel(schema);

    expect(model.columns).toHaveLength(4);
    expect(model.columns[0]).toMatchObject({
      name: "__schema_details",
      orderable: false,
      searchable: false,
    });
    expect((model.columns[0]!.render as ObjectColumnRender).display).toBe(SCHEMA_EXPAND_SLOT);
    expect(model.columns[1]).toMatchObject({ title: "Identifier", name: "id" });
    expect(model.columns[2]).toMatchObject({ title: "Display Name", name: "profile.displayName" });
    expect((model.columns[2]!.render as ObjectColumnRender).display).toBe(getSchemaCellSlot(1));
  });

  it("keeps numeric and boolean sort data orthogonal to Vue display nodes", () => {
    const model = buildSchemaDatatableModel(schema);
    const idRender = model.columns[1]!.render as ObjectColumnRender;
    const enabledRender = model.columns[3]!.render as ObjectColumnRender;
    const row = { id: 12.5, profile: { displayName: "Ada" }, enabled: false, tags: [] };

    expect(invokeRenderer(idRender, "sort", row)).toBe(12.5);
    expect(invokeRenderer(enabledRender, "sort", row)).toBe(0);
    expect(invokeRenderer(enabledRender, "filter", row)).toBe("false");
  });

  it("merges safe column overrides while preserving structural mappings", () => {
    const model = buildSchemaDatatableModel(schema, {
      id: { title: "Custom ID", visible: false, width: "8rem" },
    });

    expect(model.columns[1]).toMatchObject({
      title: "Custom ID",
      visible: false,
      width: "8rem",
      data: null,
      name: "id",
    });
    expect(model.columns[1]!.render).toBeTruthy();
  });

  it("projects and reorders schema paths, including an explicitly displayed array", () => {
    const model = buildSchemaDatatableModel(schema, undefined, [
      "profile.displayName",
      "tags",
      "id",
    ]);

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
    expect(model.arrayEntries).toEqual([]);
  });

  it("allows a renderer override without allowing data or name remapping", () => {
    const customRenderer = () => "custom";
    const model = buildSchemaDatatableModel(schema, {
      id: { render: customRenderer },
    });

    expect(model.columns[1]).toMatchObject({ data: null, name: "id" });
    expect(model.columns[1]!.render).toBe(customRenderer);
  });

  it("rejects unknown projected column paths", () => {
    expect(() => buildSchemaDatatableModel(schema, undefined, ["missing"])).toThrow(
      "Unknown column path: missing"
    );
  });

  it("supports JSON Pointer overrides for ambiguous dotted paths", () => {
    const dottedSchema: JsonSchema = {
      type: "object",
      properties: { "first.name": { type: "string" } },
    };

    const model = buildSchemaDatatableModel(dottedSchema, {
      "#/properties/first.name": { title: "Exact name" },
    });

    expect(model.columns[0]!.title).toBe("Exact name");
  });
});
