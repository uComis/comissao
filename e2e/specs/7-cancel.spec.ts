import { test, expect } from '@playwright/test';
import { ensureTestUserWithPlan, TestUserCredentials, setCurrentPeriodEnd, resetSubscriptionState } from '../routines/database';
import { LoginPage } from '../pages/login.page';
import { navigateTo } from '../routines/navigation';

/**
 * Teste E2E #7: Cancel Subscription
 *
 * Testa o fluxo de cancelamento de assinatura:
 * 1. Usuário com plano pago acessa página de cobranças
 * 2. Clica em "Cancelar assinatura"
 * 3. Modal mostra informações sobre o cancelamento
 * 4. Usuário confirma
 * 5. Sistema marca para cancelar no fim do período
 *
 * NOTA: Este teste precisa de usuário com plano pago (Pro ou Ultra).
 */
test.describe('Cancel Subscription', () => {
  let testUser: TestUserCredentials;

  test.beforeAll(async () => {
    // Busca usuário pro para testar cancelamento
    const result = await ensureTestUserWithPlan('pro');
    testUser = result.user;

    if (result.currentPlan === 'free') {
      console.log(`[Cancel] Aviso: usuário tem plano free, não pode cancelar`);
    } else {
      console.log(`[Cancel] Usuário ${result.currentPlan} encontrado: ${testUser.email}`);
    }

    // Garante que o usuário tenha current_period_end definido
    await setCurrentPeriodEnd(testUser.id, 30);
    // Limpa qualquer estado anterior de cancelamento
    await resetSubscriptionState(testUser.id);

    console.log(`[Cancel] Configurado current_period_end e resetado estado da subscription`);
  });

  // =========================================================================
  // TESTES DE VALIDAÇÃO (não mudam estado do usuário)
  // =========================================================================

  test('1. deve mostrar link de cancelar para usuário com plano pago', async ({ page }) => {
    // 1. Faz login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);

    await page.waitForURL(/\/home/, { timeout: 15000 });

    // 2. Navega para página de cobranças
    await navigateTo(page, '/cobrancas');

    // 3. Verifica que existe link/botão de cancelar
    const cancelButton = page.locator('button:has-text("Cancelar assinatura")');
    await expect(cancelButton).toBeVisible({ timeout: 10000 });
  });

  test('2. deve abrir modal ao clicar em cancelar', async ({ page }) => {
    // 1. Faz login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);

    await page.waitForURL(/\/home/, { timeout: 15000 });

    // 2. Navega para página de cobranças
    await navigateTo(page, '/cobrancas');

    // 3. Clica em cancelar
    await page.click('button:has-text("Cancelar assinatura")');

    // 4. Verifica que o modal aparece
    const modal = page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    // 5. Verifica textos do modal
    await expect(modal.getByText(/Cancelar assinatura/i)).toBeVisible();
    await expect(modal.getByText(/Manter assinatura/i)).toBeVisible();
    await expect(modal.getByText(/Confirmar cancelamento/i)).toBeVisible();
  });

  test('3. deve permitir fechar o modal sem cancelar', async ({ page }) => {
    // 1. Faz login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);

    await page.waitForURL(/\/home/, { timeout: 15000 });

    // 2. Navega para página de cobranças
    await navigateTo(page, '/cobrancas');

    // 3. Clica em cancelar
    await page.click('button:has-text("Cancelar assinatura")');

    // 4. Aguarda modal
    const modal = page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    // 5. Clica em "Manter assinatura"
    await page.click('button:has-text("Manter assinatura")');

    // 6. Modal deve fechar
    await modal.waitFor({ state: 'hidden', timeout: 3000 });

    // 7. Botão de cancelar ainda deve estar visível
    const cancelButton = page.locator('button:has-text("Cancelar assinatura")');
    await expect(cancelButton).toBeVisible();
  });

  // =========================================================================
  // TESTE DE CANCELAMENTO (marca assinatura para cancelar)
  // Deve rodar POR ÚLTIMO
  // =========================================================================

  test('4. deve cancelar assinatura com sucesso', async ({ page }) => {
    // 1. Faz login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);

    await page.waitForURL(/\/home/, { timeout: 15000 });

    // 2. Navega para página de cobranças
    await navigateTo(page, '/cobrancas');

    // 3. Clica em cancelar
    await page.click('button:has-text("Cancelar assinatura")');

    // 4. Aguarda modal
    const modal = page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    // 5. Opcional: preenche motivo
    const reasonInput = page.locator('textarea');
    if (await reasonInput.isVisible().catch(() => false)) {
      await reasonInput.fill('Teste E2E - cancelamento');
    }

    // 6. Confirma cancelamento
    await page.click('button:has-text("Confirmar cancelamento")');

    // 7. Verifica toast de sucesso
    const toast = page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible', timeout: 10000 });

    const toastText = await toast.textContent();
    expect(toastText?.toLowerCase()).toContain('cancel');

    // 8. Modal deve fechar
    await modal.waitFor({ state: 'hidden', timeout: 3000 });

    // 9. Verifica que aparece mensagem de assinatura marcada para cancelamento
    await page.waitForTimeout(1000);
    const cancelInfo = page.locator('text=/marcad[ao] para cancelamento/i');
    await expect(cancelInfo).toBeVisible({ timeout: 5000 });

    console.log('[Test] ✅ Assinatura cancelada com sucesso');
  });
});
