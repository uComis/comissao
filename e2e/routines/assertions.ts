import { Page, expect } from '@playwright/test';

/**
 * Verifica se um toast de sucesso aparece
 */
export async function expectSuccessToast(page: Page, message?: string): Promise<void> {
  const toast = page.locator('[data-sonner-toast][data-type="success"]');
  await expect(toast).toBeVisible();
  if (message) {
    await expect(toast).toContainText(message);
  }
}

/**
 * Verifica se um toast de erro aparece
 */
export async function expectErrorToast(page: Page, message?: string): Promise<void> {
  const toast = page.locator('[data-sonner-toast][data-type="error"]');
  await expect(toast).toBeVisible();
  if (message) {
    await expect(toast).toContainText(message);
  }
}

/**
 * Verifica se um toast qualquer aparece com texto específico
 */
export async function expectToastWithText(page: Page, text: string): Promise<void> {
  const toast = page.locator('[data-sonner-toast]');
  await expect(toast).toContainText(text);
}

/**
 * Verifica redirecionamento para URL específica
 */
export async function expectRedirect(page: Page, path: string): Promise<void> {
  await expect(page).toHaveURL(new RegExp(path));
}

/**
 * Verifica se elemento com data-testid está visível
 */
export async function expectVisible(page: Page, testId: string): Promise<void> {
  await expect(page.locator(`[data-testid="${testId}"]`)).toBeVisible();
}

/**
 * Verifica se elemento com data-testid NÃO está visível
 */
export async function expectNotVisible(page: Page, testId: string): Promise<void> {
  await expect(page.locator(`[data-testid="${testId}"]`)).not.toBeVisible();
}

/**
 * Verifica se texto está presente na página
 */
export async function expectText(page: Page, text: string): Promise<void> {
  await expect(page.getByText(text)).toBeVisible();
}

/**
 * Verifica se elemento contém texto específico
 */
export async function expectElementText(page: Page, testId: string, text: string): Promise<void> {
  await expect(page.locator(`[data-testid="${testId}"]`)).toContainText(text);
}
