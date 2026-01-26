import { test, expect } from '@playwright/test';
import { ensureTestUserWithPlan, getSubscriptionByAsaasId, TestUserCredentials } from '../routines/database';
import { LoginPage } from '../pages/login.page';
import { PricingPage, ConfirmPlanPage } from '../pages/pricing.page';
import {
  findAsaasCustomerByCpfCnpj,
  findAsaasSubscription,
  findPendingPayment,
  simulatePaymentConfirmation,
} from '../routines/api';

/**
 * Teste E2E #5: Upgrade Pro to Ultra
 *
 * IMPORTANTE: Os testes rodam em ordem sequencial.
 * Testes de VALIDAÇÃO vêm primeiro (não mudam estado).
 * Teste de UPGRADE vem por último (muda usuário de pro para ultra).
 *
 * NOTA: Este teste precisa de usuário PRO. Se não houver, busca free para assinar primeiro.
 */
test.describe('Upgrade Pro to Ultra', () => {
  let testUser: TestUserCredentials;

  test.beforeAll(async () => {
    // Busca usuário pro para testar upgrade
    const result = await ensureTestUserWithPlan('pro');
    testUser = result.user;

    if (result.currentPlan !== 'pro') {
      console.log(`[Upgrade] Aviso: usuário tem plano ${result.currentPlan}, pode precisar assinar Pro primeiro`);
    } else {
      console.log(`[Upgrade] Usuário Pro encontrado: ${testUser.email}`);
    }
  });

  // =========================================================================
  // TESTES DE VALIDAÇÃO (não mudam estado do usuário)
  // Devem rodar ANTES do teste de upgrade
  // =========================================================================

  test('1. deve mostrar opção de upgrade para Ultra quando usuário é Pro', async ({ page }) => {
    // 1. Faz login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);

    await page.waitForURL(/\/home/, { timeout: 15000 });

    // 2. Navega para página de planos
    const pricingPage = new PricingPage(page);
    await pricingPage.goto();

    // 3. Verifica que o plano Ultra está disponível
    await expect(page.getByText('Ultra')).toBeVisible();

    // 4. Verifica que existe botão para escolher plano Ultra
    // (usuário Pro pode fazer upgrade para Ultra)
    const ultraButton = page.locator('button:has-text("Escolher plano")').last();
    await expect(ultraButton).toBeVisible();
  });

  test('2. deve mostrar erro com documento inválido no upgrade', async ({ page }) => {
    // 1. Faz login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);

    await page.waitForURL(/\/home/, { timeout: 15000 });

    // 2. Navega para página de planos
    const pricingPage = new PricingPage(page);
    await pricingPage.goto();

    // 3. Seleciona plano Ultra
    await pricingPage.selectMonthlyBilling();
    await page.waitForTimeout(500);
    await pricingPage.selectUltraPlan();

    await page.waitForURL(/\/planos\/confirmar/, { timeout: 10000 });

    // 4. Tenta confirmar com documento inválido
    const confirmPage = new ConfirmPlanPage(page);
    await confirmPage.fillFullName('Teste Upgrade Inválido');
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

  test('3. deve permitir voltar para página de planos durante upgrade', async ({ page }) => {
    // 1. Faz login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);

    await page.waitForURL(/\/home/, { timeout: 15000 });

    // 2. Navega para página de planos
    const pricingPage = new PricingPage(page);
    await pricingPage.goto();

    // 3. Seleciona plano Ultra
    await pricingPage.selectMonthlyBilling();
    await page.waitForTimeout(500);
    await pricingPage.selectUltraPlan();

    await page.waitForURL(/\/planos\/confirmar/, { timeout: 10000 });

    // 4. Clica em voltar
    await page.click('button:has-text("Voltar")');

    // 5. Verifica redirecionamento para página de planos
    await expect(page).toHaveURL(/\/planos(?!\/confirmar)/);
  });

  // =========================================================================
  // TESTE DE UPGRADE (muda estado: pro -> ultra)
  // Deve rodar POR ÚLTIMO
  // =========================================================================

  test('4. deve permitir fazer upgrade de Pro para Ultra', async ({ page, request }) => {
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

    // 4. Seleciona o plano Ultra
    await pricingPage.selectUltraPlan();

    // 5. Verifica redirecionamento para página de confirmação
    await page.waitForURL(/\/planos\/confirmar/, { timeout: 10000 });

    // 6. Verifica se o plano correto está selecionado
    const confirmPage = new ConfirmPlanPage(page);
    await expect(page.getByText('Ultra', { exact: true }).first()).toBeVisible();

    // 7. Preenche dados de faturamento
    const fullName = 'Teste Upgrade E2E';
    const document = '11144477735'; // CPF válido para teste

    await confirmPage.confirmSubscription(fullName, document);

    // 8. Aguarda processamento (pode demorar devido à API Asaas)
    await page.waitForURL(/\/cobrancas/, { timeout: 30000 });

    // 9. Verifica que chegou na página de cobranças
    await expect(page).toHaveURL(/\/cobrancas/);

    // 9.1 Fecha o modal se estiver visível
    const closeModalButton = page.locator('button:has-text("Ver minhas faturas"), button[aria-label="Fechar"]').first();
    if (await closeModalButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeModalButton.click();
      await page.waitForTimeout(500);
    }

    // ========== VERIFICAÇÃO NO ASAAS ==========

    // 10. Busca o customer no Asaas pelo CPF
    const customersResponse = await findAsaasCustomerByCpfCnpj(request, document) as { data: Array<{ id: string }> };
    expect(customersResponse.data.length).toBeGreaterThan(0);
    const customerId = customersResponse.data[0].id;

    // 11. Busca a subscription do customer (a mais recente deve ser Ultra)
    const subscriptionsResponse = await findAsaasSubscription(request, customerId) as { data: Array<{ id: string }> };
    expect(subscriptionsResponse.data.length).toBeGreaterThan(0);
    const subscriptionId = subscriptionsResponse.data[0].id;

    // 12. Busca o pagamento pendente da subscription
    const pendingPayment = await findPendingPayment(request, subscriptionId);
    expect(pendingPayment).not.toBeNull();

    // 13. Tenta simular confirmação do pagamento
    try {
      await simulatePaymentConfirmation(request, pendingPayment!.id, pendingPayment!.value, pendingPayment!.dueDate);
      console.log(`[Test] ✅ Pagamento simulado: ${pendingPayment!.id}`);
    } catch (error) {
      console.log(`[Test] ⚠️ Simulação de pagamento falhou (sandbox date issue): ${error}`);
      console.log(`[Test] ⚠️ Continuando com verificação de subscription no banco...`);
    }

    // 14. Verifica se a subscription foi criada no banco de dados
    const userSubscription = await getSubscriptionByAsaasId(subscriptionId);
    expect(userSubscription).not.toBeNull();

    // Verifica se é plano Ultra
    const subscription = userSubscription as { user_id: string; plan_group: string; asaas_subscription_id: string };
    expect(subscription.asaas_subscription_id).toBe(subscriptionId);
    expect(subscription.plan_group).toBe('ultra');

    // 15. Log de sucesso
    console.log(`[Test] ✅ Upgrade concluído: ${subscriptionId}`);
    console.log(`[Test] ✅ Novo plano: ${subscription.plan_group}`);
  });
});
