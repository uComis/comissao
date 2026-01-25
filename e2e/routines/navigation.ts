import { Page } from '@playwright/test';

/**
 * Navega para um path específico e aguarda carregamento
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * Aguarda redirecionamento para URL específica
 */
export async function waitForUrl(page: Page, urlPattern: string | RegExp): Promise<void> {
  await page.waitForURL(urlPattern);
}

/**
 * Aguarda carregamento completo da página
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}
