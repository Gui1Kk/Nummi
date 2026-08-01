import { expect, test } from "@playwright/test";

test("renders the secure authentication entry point", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Nummi", { exact:true })).toBeVisible();
  await expect(page.getByRole("heading", { name:/entre na sua conta/i })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha", { exact:true })).toBeVisible();
});
