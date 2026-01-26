import { test, expect } from '@playwright/test';
import { ensureTestUserWithPlan, TestUserCredentials, setCurrentPeriodEnd, resetSubscriptionState } from '../routines/database';
import { LoginPage } from '../pages/login.page';
import { PricingPage } from '../pages/pricing.page';

/**
 * Teste E2E #6: Downgrade Ultra to Pro
 *
 * Testa o fluxo de agendamento de downgrade:
 * 1. Usuário Ultra seleciona plano Pro
 * 2. Sistema mostra modal informando que é um downgrade
 * 3. Usuário confirma
 * 4. Sistema agenda a mudança para o próximo ciclo
 *
 * NOTA: Este teste precisa de usuário ULTRA com período ativo.
 */
test.describe('Downgrade Ultra to Pro', () => {
  let testUser: TestUserCredentials;

  test.beforeAll(async () => {
    // Busca usuário ultra para testar downgrade
    const result = await ensureTestUserWithPlan('ultra');
    testUser = result.user;

    if (result.currentPlan !== 'ultra') {
      console.log(`[Downgrade] Aviso: usuário tem plano ${result.currentPlan}, pode não ter downgrade disponível`);
    } else {
      console.log(`[Downgrade] Usuário Ultra encontrado: ${testUser.email}`);
    }

    // Garante que o usuário tenha current_period_end definido (necessário para o modal de downgrade)
    await setCurrentPeriodEnd(testUser.id, 30);
    // Limpa qualquer estado anterior de downgrade/cancelamento
    await resetSubscriptionState(testUser.id);

    console.log(`[Downgrade] Configurado current_period_end e resetado estado da subscription`);
  });

  // =========================================================================
  // TESTES DE VALIDAÇÃO (não mudam estado do usuário)
  // =========================================================================

  test('1. deve mostrar plano Pro disponível para usuário Ultra', async ({ page }) => {
    // 1. Faz login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);

    await page.waitForURL(/\/home/, { timeout: 15000 });

    // 2. Navega para página de planos
    const pricingPage = new PricingPage(page);
    await pricingPage.goto();

    // 3. Verifica que o plano Pro está visível
    await expect(page.getByText('Pro', { exact: true }).first()).toBeVisible();

    // 4. Verifica que existe botão para escolher plano Pro
    const proButton = page.locator('button:has-text("Escolher plano")').first();
    await expect(proButton).toBeVisible();
  });

  test('2. deve abrir modal de downgrade ao selecionar plano inferior', async ({ page }) => {
    // 1. Faz login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);

    await page.waitForURL(/\/home/, { timeout: 15000 });

    // 2. Navega para página de planos
    const pricingPage = new PricingPage(page);
    await pricingPage.goto();

    // 3. Seleciona cobrança mensal
    await pricingPage.selectMonthlyBilling();
    await page.waitForTimeout(500);

    // 4. Clica em escolher plano Pro (downgrade)
    await pricingPage.selectProPlan();

    // 5. Verifica que o modal de downgrade aparece (não redireciona para /confirmar)
    // O modal deve mostrar informações sobre a mudança
    const modal = page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    // 6. Verifica textos do modal
    await expect(modal.getByText(/continua até/i)).toBeVisible();
    await expect(modal.getByText(/Manter plano atual/i)).toBeVisible();
    await expect(modal.getByText(/Confirmar mudança/i)).toBeVisible();
  });

  test('3. deve permitir cancelar o modal de downgrade', async ({ page }) => {
    // 1. Faz login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);

    await page.waitForURL(/\/home/, { timeout: 15000 });

    // 2. Navega para página de planos
    const pricingPage = new PricingPage(page);
    await pricingPage.goto();

    // 3. Seleciona plano Pro
    await pricingPage.selectMonthlyBilling();
    await page.waitForTimeout(500);
    await pricingPage.selectProPlan();

    // 4. Aguarda modal
    const modal = page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    // 5. Clica em "Manter plano atual"
    await page.click('button:has-text("Manter plano atual")');

    // 6. Modal deve fechar
    await modal.waitFor({ state: 'hidden', timeout: 3000 });

    // 7. Deve permanecer na página de planos
    await expect(page).toHaveURL(/\/planos/);
  });

  // =========================================================================
  // TESTE DE DOWNGRADE (agenda mudança de plano)
  // Deve rodar POR ÚLTIMO
  // =========================================================================

  test('4. deve agendar downgrade de Ultra para Pro', async ({ page }) => {
    // 1. Faz login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);

    await page.waitForURL(/\/home/, { timeout: 15000 });

    // 2. Navega para página de planos
    const pricingPage = new PricingPage(page);
    await pricingPage.goto();

    // 3. Seleciona plano Pro
    await pricingPage.selectMonthlyBilling();
    await page.waitForTimeout(500);
    await pricingPage.selectProPlan();

    // 4. Aguarda modal de downgrade
    const modal = page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    // 5. Confirma o downgrade
    await page.click('button:has-text("Confirmar mudança")');

    // 6. Verifica toast de sucesso
    const toast = page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible', timeout: 10000 });

    const toastText = await toast.textContent();
    expect(toastText?.toLowerCase()).toContain('agendado');

    // 7. Modal deve fechar
    await modal.waitFor({ state: 'hidden', timeout: 3000 });

    console.log('[Test] ✅ Downgrade agendado com sucesso');
  });
});
