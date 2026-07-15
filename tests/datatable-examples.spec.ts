import { readFileSync } from "node:fs";
import { expect, test } from "@nuxt/test-utils/playwright";
import type { Page } from "@playwright/test";

import { datatableExamples } from "../app/lib/datatable-examples";

const complexStruct2Rows = JSON.parse(
  readFileSync(new URL("../rust-schemars-gen/mock/complex_struct_2.json", import.meta.url), "utf8")
) as Array<{ nested_field: { foo: { foo_bar: string } } }>;

const captureRuntimeErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
};

test("all catalog routes initialise and unmount cleanly", async ({ page, goto }) => {
  const runtimeErrors = captureRuntimeErrors(page);

  for (const example of datatableExamples) {
    await goto(`/datatable/${example.slug}`, { waitUntil: "hydration" });
    await expect(page.getByRole("heading", { name: example.title, exact: true })).toBeVisible();
    await expect(
      page.getByTestId("datatable-example").locator("table.dataTable").first()
    ).toBeVisible();
  }

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "DataTable 示例索引" })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("DOM-layout controls retain the UiThing skin", async ({ page, goto }) => {
  await goto("/datatable/dom", { waitUntil: "hydration" });

  const controls = await page.locator(".dt-container").evaluate((container) =>
    [
      ".dt-buttons .dt-button",
      ".dt-length select",
      ".dt-search input",
      ".dt-paging .dt-paging-button",
    ].map((selector) => {
      const element = container.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing DataTables control: ${selector}`);

      const style = getComputedStyle(element);
      return {
        backgroundImage: style.backgroundImage,
        borderRadius: Number.parseFloat(style.borderRadius),
        selector,
      };
    })
  );

  // DataTables' default skin has 2-3px rounded controls (and a gradient for
  // buttons in light mode). UiThing controls use the shared 8px+ radius.
  expect(controls.every(({ borderRadius }) => borderRadius >= 8)).toBe(true);
  expect(
    controls.find(({ selector }) => selector === ".dt-buttons .dt-button")?.backgroundImage
  ).toBe("none");
});

test("native renderers and external reactive search work", async ({ page, goto }) => {
  const runtimeErrors = captureRuntimeErrors(page);

  await goto("/datatable/custom-component", { waitUntil: "hydration" });
  await page.getByTestId("edit-row-button").first().click();
  await expect(page.getByTestId("custom-component-status")).toContainText("Editing");

  await goto("/datatable/search-sort", { waitUntil: "hydration" });
  const table = page.getByTestId("datatable-example").locator("table.dataTable").first();
  const searchValue = complexStruct2Rows[0]!.nested_field.foo.foo_bar;
  await page.getByTestId("generated-search").fill(searchValue);
  await expect(table.locator("tbody > tr")).toHaveCount(1);
  await expect(table.locator("tbody > tr").first()).toContainText(searchValue);

  expect(runtimeErrors).toEqual([]);
});

test("extension controls and simulated server pagination work", async ({ page, goto }) => {
  const runtimeErrors = captureRuntimeErrors(page);

  await goto("/datatable/row-selection", { waitUntil: "hydration" });
  await page.locator("tbody input.dt-select-checkbox").first().click();
  await expect(page.getByText("已选择 1 行", { exact: true })).toBeVisible();

  await goto("/datatable/fixed-columns", { waitUntil: "hydration" });
  await expect(page.locator(".dtfc-fixed-start").first()).toBeVisible();

  await goto("/datatable/column-reorder", { waitUntil: "hydration" });
  await page.getByRole("button", { name: "Lock", exact: true }).click();
  await expect(page.getByTestId("reorder-status")).toContainText("Reorder locked");
  await page.getByRole("button", { name: "Unlock", exact: true }).click();
  await expect(page.getByTestId("reorder-status")).toContainText("Reorder enabled");

  await goto("/datatable/pagination", { waitUntil: "hydration" });
  const table = page.getByTestId("datatable-example").locator("table.dataTable").first();
  await expect(table.locator("tbody > tr")).toHaveCount(5);
  const addedValue = complexStruct2Rows[99]!.nested_field.foo.foo_bar;
  await page.getByRole("button", { name: "Add generated row" }).click();
  await page.getByLabel("Filter:").fill(addedValue);
  await expect(table.locator("tbody > tr")).toHaveCount(1);
  await expect(table.locator("tbody > tr").first()).toContainText(addedValue);

  expect(runtimeErrors).toEqual([]);
});

test("fixed selected columns stay opaque with a single checkbox glyph", async ({ page, goto }) => {
  const runtimeErrors = captureRuntimeErrors(page);
  await page.setViewportSize({ width: 900, height: 900 });
  await goto("/datatable/fixed-columns", { waitUntil: "hydration" });

  const scrollBody = page.locator(".dt-scroll-body");
  const table = scrollBody.locator("table.dataTable");
  const firstRow = table.locator("tbody > tr").first();
  const checkbox = firstRow.locator("input.dt-select-checkbox");

  await checkbox.click();
  await expect(checkbox).toBeChecked();
  await expect(firstRow).toHaveClass(/selected/);

  await scrollBody.evaluate(async (element) => {
    element.scrollLeft = element.scrollWidth - element.clientWidth;
    element.dispatchEvent(new Event("scroll"));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  });

  const fixedCells = firstRow.locator(":scope > td.dtfc-fixed-start");
  await expect(fixedCells).toHaveCount(2);

  const geometry = await fixedCells.evaluateAll((cells) =>
    cells.map((cell) => {
      const style = getComputedStyle(cell);
      const rect = cell.getBoundingClientRect();
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas 2D context is unavailable");
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = "rgba(0, 0, 0, 0)";
      context.fillStyle = style.backgroundColor;
      context.fillRect(0, 0, 1, 1);

      const topElement = document.elementFromPoint(
        rect.left + Math.min(rect.width / 2, 8),
        rect.top + rect.height / 2
      );

      return {
        alpha: context.getImageData(0, 0, 1, 1).data[3] / 255,
        isTopmost: topElement === cell || (topElement ? cell.contains(topElement) : false),
        left: rect.left,
        position: style.position,
        right: rect.right,
        zIndex: Number(style.zIndex),
      };
    })
  );

  expect(geometry.every(({ alpha }) => alpha === 1)).toBe(true);
  expect(geometry.every(({ position }) => position === "sticky")).toBe(true);
  expect(geometry.every(({ zIndex }) => zIndex >= 1)).toBe(true);
  expect(geometry.every(({ isTopmost }) => isTopmost)).toBe(true);
  expect(Math.abs(geometry[1]!.left - geometry[0]!.right)).toBeLessThanOrEqual(1);

  const paintedCheckboxLayers = await checkbox.evaluate((input) => {
    const elementStyle = getComputedStyle(input);
    const beforeStyle = getComputedStyle(input, "::before");
    const afterStyle = getComputedStyle(input, "::after");
    const paintsContent = (style: CSSStyleDeclaration) =>
      style.display !== "none" && !["none", "normal", '""', "''"].includes(style.content);

    return [
      elementStyle.backgroundImage !== "none",
      paintsContent(beforeStyle),
      paintsContent(afterStyle),
    ].filter(Boolean).length;
  });

  expect(paintedCheckboxLayers).toBe(1);
  expect(runtimeErrors).toEqual([]);
});
