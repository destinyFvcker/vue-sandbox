import { readFileSync } from "node:fs";
import { expect, test } from "@nuxt/test-utils/playwright";
import type { Page } from "@playwright/test";

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

test("schema table supports search, sorting, and native renderers", async ({ page, goto }) => {
  const runtimeErrors = captureRuntimeErrors(page);
  await page.setViewportSize({ width: 900, height: 900 });
  await goto("/schema-datatable", { waitUntil: "hydration" });

  const demo = page.getByTestId("schema-datatable-demo");
  const container = demo.locator(".dt-container");
  const scrollHead = container.locator(".dt-scroll-head");
  const scrollBody = container.locator(".dt-scroll-body");
  const table = scrollBody.locator("table.dataTable");

  await expect(
    page.getByRole("heading", { name: "Generated JSON Schema DataTable" })
  ).toBeVisible();
  await expect(scrollHead.locator("thead")).toContainText("Foo Foo");
  await expect(scrollHead.locator("thead")).toContainText("Foo Bar");
  await expect(scrollHead.locator("thead")).toContainText("Normal Enum");
  await expect(table.locator("tbody > tr")).toHaveCount(5);
  await expect(table.locator("tbody .tracking-wide").first()).toHaveText(/foo|bar/i);

  const headerGeometry = await container
    .locator(".dt-scroll thead")
    .evaluateAll((headers) => headers.map((header) => header.getBoundingClientRect().height));
  expect(headerGeometry).toHaveLength(2);
  expect(headerGeometry.filter((height) => height > 0)).toHaveLength(1);
  expect(
    await scrollBody.locator("thead").evaluate((header) => header.getBoundingClientRect().height)
  ).toBe(0);
  expect(await scrollBody.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
    true
  );

  await expect(container.locator(".dt-layout-table ~ .dt-layout-row .dt-length")).toHaveCount(1);
  await expect(container.locator(".dt-layout-table ~ .dt-layout-row .dt-info")).toHaveCount(1);
  await expect(container.locator(".dt-layout-table ~ .dt-layout-row .dt-paging")).toHaveCount(1);
  await expect(container.locator(".dt-layout-table ~ .dt-layout-row .dt-length label")).toHaveCSS(
    "white-space",
    "nowrap"
  );

  const search = demo.locator(".dt-search input").first();
  const searchValue = complexStruct2Rows[11]!.nested_field.foo.foo_bar;
  await search.fill(`"${searchValue}"`);
  await expect(table.locator("tbody > tr")).toHaveCount(1);
  await expect(table.locator("tbody > tr").first()).toContainText(searchValue);

  await search.clear();
  await scrollHead.getByRole("columnheader", { name: /Foo Foo/ }).click();
  const amountTexts = await table.locator("tbody > tr > td:first-child").allTextContents();
  const amounts = amountTexts.map((value) => Number(value.replace(/[^\d.-]/g, "")));
  expect(amounts).toEqual([...amounts].sort((left, right) => left - right));
  expect(runtimeErrors).toEqual([]);
});

test("reactive local updates work without Vue cell mounts", async ({ page, goto }) => {
  const runtimeErrors = captureRuntimeErrors(page);
  await goto("/schema-datatable", { waitUntil: "hydration" });

  const demo = page.getByTestId("schema-datatable-demo");
  const table = demo.locator(".dt-scroll-body table.dataTable");
  await page.getByTestId("add-row").click();
  const search = demo.locator(".dt-search input").first();
  const addedValue = complexStruct2Rows[12]!.nested_field.foo.foo_bar;
  await search.fill(addedValue);
  await expect(table.locator("tbody > tr")).toHaveCount(1);
  await expect(table.locator("tbody > tr").first()).toContainText(addedValue);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "DataTable 示例索引" })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});
