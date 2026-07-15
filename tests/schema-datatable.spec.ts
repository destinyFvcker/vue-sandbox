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
  await goto("/schema-datatable", { waitUntil: "hydration" });

  const demo = page.getByTestId("schema-datatable-demo");
  const table = demo.locator("table.dataTable").first();

  await expect(
    page.getByRole("heading", { name: "Generated JSON Schema DataTable" })
  ).toBeVisible();
  await expect(table.locator("thead")).toContainText("Foo Foo");
  await expect(table.locator("thead")).toContainText("Foo Bar");
  await expect(table.locator("thead")).toContainText("Normal Enum");
  await expect(table.locator("tbody > tr")).toHaveCount(5);
  await expect(table.locator("tbody .tracking-wide").first()).toHaveText(/foo|bar/i);

  const search = demo.locator(".dt-search input").first();
  const searchValue = complexStruct2Rows[11]!.nested_field.foo.foo_bar;
  await search.fill(`"${searchValue}"`);
  await expect(table.locator("tbody > tr")).toHaveCount(1);
  await expect(table.locator("tbody > tr").first()).toContainText(searchValue);

  await search.clear();
  await table.getByRole("columnheader", { name: /Foo Foo/ }).click();
  const amountTexts = await table.locator("tbody > tr > td:first-child").allTextContents();
  const amounts = amountTexts.map((value) => Number(value.replace(/[^\d.-]/g, "")));
  expect(amounts).toEqual([...amounts].sort((left, right) => left - right));
  expect(runtimeErrors).toEqual([]);
});

test("reactive local updates work without Vue cell mounts", async ({ page, goto }) => {
  const runtimeErrors = captureRuntimeErrors(page);
  await goto("/schema-datatable", { waitUntil: "hydration" });

  const demo = page.getByTestId("schema-datatable-demo");
  const table = demo.locator("table.dataTable").first();
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
