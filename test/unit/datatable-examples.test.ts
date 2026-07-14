import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  createDemoPeople,
  datatableExampleGroups,
  datatableExamples,
} from "../../app/lib/datatable-examples";

describe("datatable example catalog", () => {
  const examplesDirectory = fileURLToPath(
    new URL("../../app/components/DatatableExamples/", import.meta.url)
  );

  it("contains every UiThing DataTable example exactly once", () => {
    const expectedSlugs = [
      "dom",
      "custom-component",
      "layout",
      "raw-performance",
      "schema-performance",
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

  it("uses the raw DataTable adapter only for the dedicated performance comparison", () => {
    const componentSources = readdirSync(examplesDirectory)
      .filter((file) => file.endsWith(".vue") && file !== "ExampleShell.vue")
      .map((file) => ({ file, source: readFileSync(join(examplesDirectory, file), "utf8") }));

    const rawPerformance = componentSources.find(({ file }) => file === "RawPerformance.vue");
    expect(rawPerformance?.source).toContain("<UiDatatable");
    expect(rawPerformance?.source).not.toContain("<UiSchemaDatatable");

    const schemaComponents = componentSources.filter(({ file }) => file !== "RawPerformance.vue");
    expect(schemaComponents).not.toHaveLength(0);
    for (const { file, source } of schemaComponents) {
      expect(source, file).toContain("<UiSchemaDatatable");
      expect(source, file).not.toContain("<UiDatatable");
    }
  });

  it("uses the configured client runtime for every value import", () => {
    const appDirectory = fileURLToPath(new URL("../../app/", import.meta.url));
    const sourceFiles: string[] = [];

    const collectSources = (directory: string) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) collectSources(path);
        else if (entry.name.endsWith(".ts") || entry.name.endsWith(".vue")) sourceFiles.push(path);
      }
    };

    collectSources(appDirectory);
    const runtimeBareCoreImports = sourceFiles.filter((file) =>
      /import\s+(?!type\b)[^;]*from\s+["']datatables\.net["']/.test(readFileSync(file, "utf8"))
    );

    expect(runtimeBareCoreImports).toEqual([]);
  });
});
