import { expect, test } from "@playwright/test";

test("renders the authentication entry point", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /dinheiro claro/i })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
});

test("has no horizontal overflow on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
