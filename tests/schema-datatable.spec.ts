import { expect, test } from "@nuxt/test-utils/playwright";
import type { Page } from "@playwright/test";

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

  await expect(page.getByRole("heading", { name: "JSON Schema DataTable" })).toBeVisible();
  await expect(table.locator("thead")).toContainText("Customer");
  await expect(table.locator("thead")).toContainText("Region");
  await expect(table.locator("thead")).toContainText("Amount");
  await expect(table.locator("tbody > tr")).toHaveCount(5);
  await expect(table.locator("tbody .tracking-wide").first()).toHaveText("active");

  const search = demo.locator(".dt-search input").first();
  await search.fill('"Customer 12"');
  await expect(table.locator("tbody > tr")).toHaveCount(1);
  await expect(table.locator("tbody > tr").first()).toContainText("Customer 12");

  await search.clear();
  await table.getByRole("columnheader", { name: /Amount/ }).click();
  const amountTexts = await table.locator("tbody > tr > td.dt-body-right").allTextContents();
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
  await search.fill("Added Customer 13");
  await expect(table.locator("tbody > tr")).toHaveCount(1);
  await expect(table.locator("tbody > tr").first()).toContainText("Added Customer 13");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "DataTable 示例索引" })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});
