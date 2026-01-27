import { test, expect } from '../fixtures/test-report';
import { getSubscriptionByAsaasId } from '../routines/database';
import { LoginPage } from '../pages/login.page';
import { PricingPage, ConfirmPlanPage } from '../pages/pricing.page';
import {
  findAsaasCustomerByCpfCnpj,
  findAsaasSubscription,
  findPendingPayment,
  simulatePaymentConfirmation,
  findAsaasPaymentsByCustomer,
} from '../routines/api';
import { requireTestUser, updateTestUserPlan, SharedTestUser } from '../state/shared-user';
import { debugPause } from '../config/debug';

/**
 * Teste E2E #5: Upgrade Pro to Ultra
 *
 * QUINTO TESTE DA CADEIA REAL:
 * Register → Login → Profile → Subscribe → Upgrade
 *
 * Este teste USA o usuário criado pelo teste de Register.
 * O usuário deve estar com plano PRO (após o teste Subscribe).
 * Fluxo completo: verificações → validações → upgrade real no Asaas
 */
test.describe('Upgrade Pro to Ultra', () => {
  let testUser: SharedTestUser;

  test.beforeAll(async () => {
    testUser = requireTestUser();

    if (testUser.plan !== 'pro') {
      console.log(`[Upgrade] ⚠️ Usuário tem plano ${testUser.plan}, deveria ser PRO`);
    } else {
      console.log(`[Upgrade] ✅ Usuário Pro encontrado: ${testUser.email}`);
    }
  });

  test('deve validar dados e permitir upgrade para Ultra', async ({ page, request, testReport }) => {
    // Configura relatório
    testReport.setUser({
      email: testUser.email,
      password: testUser.password,
      id: testUser.id,
    });
    testReport.addAction('Iniciando teste de upgrade para Ultra');

    // 1. Faz login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await page.waitForURL(/\/home/, { timeout: 15000 });
    testReport.addAction('Login realizado com sucesso');
    await debugPause(page, 'medium');

    // 2. Navega para página de planos
    const pricingPage = new PricingPage(page);
    await pricingPage.goto();
    testReport.addAction('Navegou para página de planos');
    await debugPause(page, 'medium');

    // ========== PASSO 1: Verifica opção de upgrade ==========
    testReport.addAction('Verificando opção de upgrade');
    await expect(page.getByText('Ultra')).toBeVisible();
    const ultraButton = page.locator('button:has-text("Escolher plano")').last();
    await expect(ultraButton).toBeVisible();
    testReport.addAction('Plano Ultra disponível para upgrade');
    await debugPause(page, 'long');

    // 3. Seleciona plano Ultra
    await pricingPage.selectMonthlyBilling();
    await debugPause(page, 'short');
    await page.waitForTimeout(500);
    await pricingPage.selectUltraPlan();
    testReport.addAction('Selecionou plano Ultra mensal');
    await debugPause(page, 'short');
    await page.waitForURL(/\/planos\/confirmar/, { timeout: 10000 });
    await debugPause(page, 'medium');

    const confirmPage = new ConfirmPlanPage(page);

    // ========== PASSO 2: Documento inválido ==========
    testReport.addAction('Testando documento inválido');
    await confirmPage.fillFullName('Teste Upgrade Inválido');
    await confirmPage.fillDocument('123'); // Documento muito curto
    await debugPause(page, 'short');
    await confirmPage.confirm();
    await debugPause(page, 'short');

    let toast = page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible', timeout: 10000 });
    expect(await toast.getAttribute('data-type')).toBe('error');
    testReport.addAction('Erro exibido para documento inválido');
    await debugPause(page, 'long');
    await expect(page).toHaveURL(/\/planos\/confirmar/);
    await toast.waitFor({ state: 'hidden', timeout: 10000 });

    // ========== PASSO 3: Voltar e retornar ==========
    testReport.addAction('Testando navegação voltar');
    await page.click('button:has-text("Voltar")');
    await debugPause(page, 'short');
    await expect(page).toHaveURL(/\/planos(?!\/confirmar)/);
    testReport.addAction('Voltou para página de planos');
    await debugPause(page, 'medium');

    // Seleciona plano novamente
    await pricingPage.selectMonthlyBilling();
    await debugPause(page, 'short');
    await page.waitForTimeout(500);
    await pricingPage.selectUltraPlan();
    testReport.addAction('Selecionou plano Ultra novamente');
    await debugPause(page, 'short');
    await page.waitForURL(/\/planos\/confirmar/, { timeout: 10000 });
    await debugPause(page, 'medium');

    // ========== PASSO 4: Dados válidos - Fazer upgrade ==========
    testReport.addAction('Confirmando upgrade com dados válidos');
    const fullName = 'Teste Upgrade E2E';
    const document = '11144477735';

    await confirmPage.confirmSubscription(fullName, document);
    await debugPause(page, 'short');

    // Aguarda processamento e redirecionamento
    await page.waitForURL(/\/cobrancas/, { timeout: 30000 });
    await expect(page).toHaveURL(/\/cobrancas/);
    testReport.addAction('Redirecionado para /cobrancas');
    await debugPause(page, 'medium');

    // Fecha modal se visível
    const closeModalButton = page.locator('button:has-text("Ver minhas faturas"), button[aria-label="Fechar"]').first();
    if (await closeModalButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeModalButton.click();
      await debugPause(page, 'short');
      await page.waitForTimeout(500);
    }

    // ========== VERIFICAÇÃO NO ASAAS ==========
    testReport.addAction('Verificando upgrade no Asaas...');
    const customersResponse = await findAsaasCustomerByCpfCnpj(request, document) as { data: Array<{ id: string }> };
    expect(customersResponse.data.length).toBeGreaterThan(0);
    const customerId = customersResponse.data[0].id;
    testReport.setAsaasCustomer({ id: customerId });
    testReport.addAction('Cliente encontrado no Asaas', `ID: ${customerId}`);

    const subscriptionsResponse = await findAsaasSubscription(request, customerId) as { data: Array<{ id: string }> };
    expect(subscriptionsResponse.data.length).toBeGreaterThan(0);
    const subscriptionId = subscriptionsResponse.data[0].id;
    testReport.addAction('Assinatura encontrada no Asaas', `ID: ${subscriptionId}`);

    // Busca cobranças pendentes
    const paymentsResponse = await findAsaasPaymentsByCustomer(request, customerId);
    const pendingPayments = paymentsResponse.data?.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE') || [];
    testReport.setInvoicesBefore(pendingPayments.map(p => ({
      id: p.id,
      value: p.value,
      status: p.status,
      dueDate: p.dueDate,
      description: p.description,
    })));

    const pendingPayment = await findPendingPayment(request, subscriptionId);
    expect(pendingPayment).not.toBeNull();
    testReport.addAction('Cobrança pendente encontrada', `ID: ${pendingPayment!.id} - R$ ${pendingPayment!.value}`);

    try {
      await simulatePaymentConfirmation(request, pendingPayment!.id, pendingPayment!.value, pendingPayment!.dueDate);
      testReport.addAction('Pagamento simulado com sucesso');
      console.log(`[Test] ✅ Pagamento simulado: ${pendingPayment!.id}`);
    } catch (error) {
      testReport.addNote(`Simulação de pagamento falhou: ${error}`);
      console.log(`[Test] ⚠️ Simulação de pagamento falhou: ${error}`);
    }

    // Verifica subscription no banco
    const userSubscription = await getSubscriptionByAsaasId(subscriptionId);
    expect(userSubscription).not.toBeNull();

    const subscription = userSubscription as { user_id: string; plan_group: string; asaas_subscription_id: string };
    expect(subscription.asaas_subscription_id).toBe(subscriptionId);
    expect(subscription.plan_group).toBe('ultra');
    testReport.addAction('Upgrade verificado no banco', `Plano: ${subscription.plan_group}`);

    updateTestUserPlan('ultra');

    testReport.addNote('Upgrade para Ultra concluído com sucesso');
    console.log(`[Test] ✅ Upgrade para Ultra concluído: ${subscriptionId}`);
    await debugPause(page, 'long');
  });
});
