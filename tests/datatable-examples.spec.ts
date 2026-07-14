import { expect, test } from "@nuxt/test-utils/playwright";
import type { Page } from "@playwright/test";

import { datatableExamples } from "../app/lib/datatable-examples";

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

test("Vue slots and external reactive search work", async ({ page, goto }) => {
  const runtimeErrors = captureRuntimeErrors(page);

  await goto("/datatable/custom-component", { waitUntil: "hydration" });
  await page.getByTestId("edit-row-button").first().click();
  await expect(page.getByTestId("custom-component-status")).toContainText("Editing");

  await goto("/datatable/search-sort", { waitUntil: "hydration" });
  const table = page.getByTestId("datatable-example").locator("table.dataTable").first();
  await page.getByTestId("keyword-search").fill("json schema");
  await expect(table.locator("tbody > tr")).toHaveCount(1);
  await expect(table.locator("tbody > tr").first()).toContainText("json schema table");
  await expect(table.getByRole("link", { name: "Open" })).toBeVisible();

  expect(runtimeErrors).toEqual([]);
});

test("extension controls and simulated server pagination work", async ({ page, goto }) => {
  const runtimeErrors = captureRuntimeErrors(page);

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
  await page.getByRole("button", { name: "Add user" }).click();
  const modal = page.getByTestId("add-user-modal");
  await expect(modal).toBeVisible();
  await modal.getByRole("textbox", { name: "Name", exact: true }).fill("Ada Lovelace");
  await modal.getByRole("textbox", { name: "Email", exact: true }).fill("ada@example.com");
  await modal.getByRole("button", { name: "Create user" }).click();
  await expect(page.getByTestId("add-user-modal")).toHaveCount(0);
  await page.getByLabel("Filter:").fill("ada@example.com");
  await expect(table.locator("tbody > tr")).toHaveCount(1);
  await expect(table.locator("tbody > tr").first()).toContainText("Ada Lovelace");

  expect(runtimeErrors).toEqual([]);
});
