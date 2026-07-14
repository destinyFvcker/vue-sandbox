import { expect, test } from "@nuxt/test-utils/playwright";
import type { Page } from "@playwright/test";

const median = (values: number[]) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)]!;
};

const captureRuntimeErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
};

test("Raw and Schema 100k tables meet the comparison budget", async ({ page, goto }) => {
  test.setTimeout(240_000);
  const runtimeErrors = captureRuntimeErrors(page);
  const samples = { raw: [] as number[], schema: [] as number[] };

  const sample = async (kind: "raw" | "schema", record = true) => {
    await page.goto("about:blank");
    const startedAt = Date.now();
    await goto(`/datatable/${kind}-performance`, {
      waitUntil: "hydration",
      timeout: 30_000,
    });

    const host = page.getByTestId(`${kind}-performance`);
    await expect(host).toHaveAttribute("data-ready", "true", { timeout: 30_000 });
    const readyMs = Number(await host.getAttribute("data-ready-ms"));
    expect(Number.isFinite(readyMs)).toBe(true);
    expect(readyMs).toBeLessThan(30_000);

    const container = host.locator(".dt-container");
    await expect(container.locator(".dt-info")).toContainText("100,000");
    await expect(container.locator("tbody > tr")).toHaveCount(2_000);
    await expect(container.locator(".dtsb-searchBuilder")).toBeVisible();
    await expect(container.locator(".dt-buttons .dt-button")).toHaveCount(4);
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    );

    const elapsedMs = Date.now() - startedAt;
    expect(elapsedMs).toBeLessThan(30_000);
    if (record) samples[kind].push(elapsedMs);
  };

  // Warm both implementations before measuring, then alternate order to avoid
  // systematically giving the Schema page a hotter JS/DataTables cache.
  await sample("raw", false);
  await sample("schema", false);
  const sampleOrder = [
    ["raw", "schema"],
    ["schema", "raw"],
    ["raw", "schema"],
  ] as const;
  for (const pair of sampleOrder) {
    for (const kind of pair) await sample(kind);
  }

  expect(samples.raw).toHaveLength(3);
  expect(samples.schema).toHaveLength(3);
  expect(median(samples.schema)).toBeLessThanOrEqual(median(samples.raw) * 2 + 2_000);
  expect(runtimeErrors).toEqual([]);
});
