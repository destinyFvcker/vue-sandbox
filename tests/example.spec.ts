import { expect, test } from "@nuxt/test-utils/playwright";

test("homepage lists the DataTable examples", async ({ page, goto }) => {
  await goto("/", { waitUntil: "hydration" });
  await expect(page).toHaveTitle(/DataTable Examples/);
  await expect(page.getByRole("heading", { name: "DataTable 示例索引" })).toBeVisible();
  await expect(page.locator('[data-testid^="example-link-"]')).toHaveCount(19);
});
