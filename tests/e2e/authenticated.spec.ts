import { expect, test } from "@playwright/test";

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

test.describe("authenticated Nummi", () => {
  test.skip(!email || !password, "E2E_TEST_EMAIL and E2E_TEST_PASSWORD are required");

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("E-mail").fill(email ?? "");
    await page.getByLabel("Senha", { exact: true }).fill(password ?? "");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  });

  test("navigates through every authenticated domain", async ({ page }) => {
    const destinations = [
      "Lançamentos",
      "Recorrências",
      "Orçamentos",
      "Relatórios",
      "Notificações",
      "Conta e ajustes",
      "Ajuda"
    ];

    for (const destination of destinations) {
      await page.getByRole("button", { name: new RegExp(destination, "i") }).click();
      await expect(page.getByRole("heading", { name: destination })).toBeVisible();
    }
  });

  test("shows account preferences and protected role", async ({ page }) => {
    await page.getByRole("button", { name: /conta e ajustes/i }).click();
    await expect(page.getByText(/acesso: usuário|acesso: administrador/i)).toBeVisible();
    await expect(page.getByLabel("Moeda")).toBeVisible();
    await expect(page.getByLabel("Idioma e formato")).toBeVisible();
    await expect(page.getByLabel("Fuso horário")).toBeVisible();
    await expect(page.getByLabel("Primeiro dia da semana")).toBeVisible();
    await expect(page.getByLabel("Avisar recorrências com antecedência")).toBeVisible();
  });

  test("has no horizontal overflow on authenticated mobile navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
});
