import { test, expect } from '@playwright/test';
import { createTestUserWithCredentials, cleanupTestUser } from '../routines/database';
import { LoginPage } from '../pages/login.page';
import { PricingPage, ConfirmPlanPage } from '../pages/pricing.page';
import { expectSuccessToast } from '../routines/assertions';
import { navigateTo } from '../routines/navigation';

/**
 * Teste E2E #4: Subscribe to Pro Plan
 *
 * Testa o fluxo completo de assinatura:
 * 1. Login com usuário existente
 * 2. Navegar para página de planos
 * 3. Selecionar plano Pro mensal
 * 4. Preencher dados de faturamento
 * 5. Confirmar assinatura
 * 6. Verificar redirecionamento para página de cobrança
 *
 * NOTA: Este teste cria uma assinatura real no Asaas Sandbox
 * e gera uma fatura. O pagamento não é simulado neste teste.
 */
test.describe('Subscribe to Pro Plan', () => {
  let testUser: { email: string; password: string; id: string };

  test.beforeAll(async () => {
    // Cria usuário via API Admin para testar assinatura
    testUser = await createTestUserWithCredentials('e2e-subscribe');
  });

  test.afterAll(async () => {
    if (testUser?.email) {
      await cleanupTestUser(testUser.email);
    }
  });

  test('deve permitir assinar o plano Pro mensal', async ({ page }) => {
    // 1. Faz login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);

    // Aguarda redirecionamento para home
    await page.waitForURL(/\/home/, { timeout: 15000 });

    // 2. Navega para página de planos
    const pricingPage = new PricingPage(page);
    await pricingPage.goto();

    // 3. Seleciona cobrança mensal (para teste mais rápido)
    await pricingPage.selectMonthlyBilling();

    // Aguarda atualização da UI
    await page.waitForTimeout(500);

    // 4. Seleciona o plano Pro
    await pricingPage.selectProPlan();

    // 5. Verifica redirecionamento para página de confirmação
    await page.waitForURL(/\/planos\/confirmar/, { timeout: 10000 });

    // 6. Verifica se o plano correto está selecionado
    const confirmPage = new ConfirmPlanPage(page);
    await expect(page.locator('text=Pro')).toBeVisible();

    // 7. Preenche dados de faturamento
    const fullName = 'Teste Assinatura E2E';
    const document = '12345678901'; // CPF para teste

    await confirmPage.confirmSubscription(fullName, document);

    // 8. Aguarda processamento (pode demorar devido à API Asaas)
    // O sistema deve redirecionar para /cobrancas após criar a assinatura
    await page.waitForURL(/\/cobrancas/, { timeout: 30000 });

    // 9. Verifica que chegou na página de cobranças com sucesso
    await expect(page).toHaveURL(/\/cobrancas/);

    // 10. Opcionalmente verifica se há uma fatura listada
    // (depende da implementação da página de cobranças)
  });

  test('deve mostrar erro com documento inválido na confirmação', async ({ page }) => {
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

    await page.waitForURL(/\/planos\/confirmar/, { timeout: 10000 });

    // 4. Tenta confirmar com documento inválido
    const confirmPage = new ConfirmPlanPage(page);
    await confirmPage.fillFullName('Teste Documento Inválido');
    await confirmPage.fillDocument('123'); // Documento muito curto
    await confirmPage.confirm();

    // 5. Verifica toast de erro
    const toast = page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible', timeout: 10000 });

    const toastType = await toast.getAttribute('data-type');
    expect(toastType).toBe('error');

    // 6. Deve permanecer na página de confirmação
    await expect(page).toHaveURL(/\/planos\/confirmar/);
  });

  test('deve mostrar erro com nome incompleto na confirmação', async ({ page }) => {
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

    await page.waitForURL(/\/planos\/confirmar/, { timeout: 10000 });

    // 4. Tenta confirmar com apenas primeiro nome
    const confirmPage = new ConfirmPlanPage(page);
    await confirmPage.fillFullName('Apenas'); // Sem sobrenome
    await confirmPage.fillDocument('12345678901');
    await confirmPage.confirm();

    // 5. Verifica toast de erro (validação requer nome completo)
    const toast = page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible', timeout: 10000 });

    const toastType = await toast.getAttribute('data-type');
    expect(toastType).toBe('error');

    // 6. Deve permanecer na página de confirmação
    await expect(page).toHaveURL(/\/planos\/confirmar/);
  });

  test('deve permitir voltar para página de planos', async ({ page }) => {
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

    await page.waitForURL(/\/planos\/confirmar/, { timeout: 10000 });

    // 4. Clica em voltar
    await page.click('button:has-text("Voltar")');

    // 5. Verifica redirecionamento para página de planos
    await expect(page).toHaveURL(/\/planos(?!\/confirmar)/);
  });
});
