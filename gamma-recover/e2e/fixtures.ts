import { test as base, expect, type Page } from '@playwright/test';
export async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill('admin@gamma.demo');
  await page.getByLabel('Senha', { exact: true }).fill('Gamma@123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
}
export const test = base.extend<{ adminSession: void }>({
  adminSession: [
    async ({ page }, use) => {
      await signIn(page);
      await use();
    },
    { auto: true },
  ],
});
export { expect };
