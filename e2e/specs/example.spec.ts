import { test, expect } from '@playwright/test';
import { navigateTo } from '../routines';

/**
 * Teste de exemplo para verificar se a estrutura está funcionando
 * Este arquivo pode ser removido após a confirmação
 */
test.describe('Estrutura E2E', () => {
  test('deve carregar a landing page', async ({ page }) => {
    await navigateTo(page, '/');
    await expect(page).toHaveTitle(/uComis/i);
  });

  test('deve navegar para login', async ({ page }) => {
    await navigateTo(page, '/login');
    await expect(page.url()).toContain('/login');
  });
});
