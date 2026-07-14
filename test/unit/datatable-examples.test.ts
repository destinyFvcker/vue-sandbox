import { describe, expect, it } from "vitest";

import {
  createDemoPeople,
  datatableExampleGroups,
  datatableExamples,
} from "../../app/lib/datatable-examples";

describe("datatable example catalog", () => {
  it("contains every UiThing DataTable example exactly once", () => {
    const expectedSlugs = [
      "dom",
      "custom-component",
      "layout",
      "simple",
      "image",
      "no-horizontal",
      "striped",
      "vertical-lines",
      "dense",
      "row-selection",
      "card",
      "sticky-header",
      "badge-icons",
      "search-sort",
      "fixed-columns",
      "column-reorder",
      "pagination",
    ];

    expect(datatableExamples.map((example) => example.slug)).toEqual(expectedSlugs);
    expect(new Set(expectedSlugs).size).toBe(datatableExamples.length);
  });

  it("assigns every example to an index group", () => {
    expect(
      datatableExamples.every((example) => datatableExampleGroups.includes(example.group))
    ).toBe(true);
  });

  it("creates deterministic demo records", () => {
    expect(createDemoPeople(3)).toEqual(createDemoPeople(3));
    expect(createDemoPeople(3)).toHaveLength(3);
    expect(createDemoPeople(3)[0]).toMatchObject({ id: 1, name: "Amelia Chen" });
  });
});
