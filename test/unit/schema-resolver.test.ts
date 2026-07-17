import { describe, expect, it } from "vitest";
import type { JsonSchema7 } from "@jsonforms/core";

import {
  collectSchemaEntries,
  getValueAtPath,
  normalizeRowSchema,
  partitionSchemaEntries,
} from "../../app/lib/dt-schema-resolver";

describe("schema resolver", () => {
  it("flattens nested objects while retaining exact property segments", () => {
    const schema: JsonSchema7 = {
      type: "object",
      properties: {
        profile: {
          type: "object",
          properties: {
            "display.name": { type: "string" },
          },
        },
      },
    };

    const entries = collectSchemaEntries(schema);

    expect(entries).toEqual([
      expect.objectContaining({
        dataPath: "profile.display.name",
        dataSegments: ["profile", "display.name"],
        schemaPath: "#/properties/profile/properties/display.name",
      }),
    ]);
    expect(getValueAtPath({ profile: { "display.name": "Ada" } }, entries[0]!.dataSegments)).toBe(
      "Ada"
    );
  });

  it("resolves definitions and merges allOf properties", () => {
    const schema: JsonSchema7 = {
      type: "object",
      properties: {
        profile: { $ref: "#/definitions/Profile" },
      },
      definitions: {
        Base: {
          type: "object",
          properties: { name: { type: "string" } },
        },
        Profile: {
          allOf: [
            { $ref: "#/definitions/Base" },
            { type: "object", properties: { region: { type: "string" } } },
          ],
        },
      },
    };

    expect(collectSchemaEntries(schema).map((entry) => entry.dataPath)).toEqual([
      "profile.name",
      "profile.region",
    ]);
  });

  it("unions duplicate paths from object variants without duplicating columns", () => {
    const schema: JsonSchema7 = {
      oneOf: [
        { type: "object", properties: { value: { type: "string" } } },
        { type: "object", properties: { value: { type: "number" }, extra: { type: "boolean" } } },
      ],
    };

    const entries = collectSchemaEntries(schema);

    expect(entries.map((entry) => entry.dataPath)).toEqual(["value", "extra"]);
    expect(entries[0]!.schema.anyOf).toHaveLength(2);
  });

  it("separates direct and nullable array fields", () => {
    const schema: JsonSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        history: {
          anyOf: [
            { type: "array", items: { type: "object", properties: { id: { type: "integer" } } } },
            { type: "null" },
          ],
        },
      },
    };

    const partitioned = partitionSchemaEntries(collectSchemaEntries(schema));

    expect(partitioned.columnEntries.map((entry) => entry.dataPath)).toEqual(["name"]);
    expect(partitioned.arrayEntries.map((entry) => entry.dataPath)).toEqual(["tags", "history"]);
  });

  it("stops circular references while retaining reachable scalar fields", () => {
    const schema: JsonSchema7 = {
      type: "object",
      properties: { node: { $ref: "#/definitions/Node" } },
      definitions: {
        Node: {
          type: "object",
          properties: {
            value: { type: "string" },
            child: { $ref: "#/definitions/Node" },
          },
        },
      },
    };

    expect(collectSchemaEntries(schema).map((entry) => entry.dataPath)).toEqual(["node.value"]);
  });

  it("accepts a homogeneous top-level array schema", () => {
    const schema: JsonSchema7 = {
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "integer" } },
      },
    };

    const normalized = normalizeRowSchema(schema);

    expect(normalized.rowSchema).toMatchObject({ type: "object" });
    expect(collectSchemaEntries(normalized.rowSchema, normalized.rootSchema)[0]?.dataPath).toBe(
      "id"
    );
  });
});
