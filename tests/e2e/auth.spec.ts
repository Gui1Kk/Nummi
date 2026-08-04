import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => { await page.goto("/"); });

test("starts in the dark neon theme", async ({ page }) => {
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("heading", { name: /entre na sua conta/i })).toBeVisible();
});

test("registration requires password confirmation and explains email confirmation", async ({ page }) => {
  await page.getByRole("button", { name: /criar uma conta/i }).click();
  await expect(page.getByLabel("Nome")).toBeVisible();
  await expect(page.getByLabel("Senha", { exact:true })).toBeVisible();
  await expect(page.getByLabel("Confirmar senha")).toBeVisible();
  await expect(page.getByText(/10\+ caracteres/i)).toBeVisible();
});

test("forgot-password flow is discoverable without exposing account existence", async ({ page }) => {
  await page.getByRole("button", { name: /esqueci minha senha/i }).click();
  await expect(page.getByRole("heading", { name: /recupere o acesso/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /enviar recuperação/i })).toBeVisible();
});

test("does not overflow horizontally on a phone", async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
