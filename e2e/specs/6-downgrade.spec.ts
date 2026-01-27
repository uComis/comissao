import { test, expect } from '../fixtures/test-report';
import { ensureTestUserWithPlan, TestUserCredentials, setCurrentPeriodEnd, resetSubscriptionState, getUserSubscription } from '../routines/database';
import { findAsaasPaymentsByCustomer } from '../routines/api';
import { LoginPage } from '../pages/login.page';
import { PricingPage } from '../pages/pricing.page';
import { debugPause } from '../config/debug';

/**
 * Teste E2E #6: Downgrade Ultra to Pro
 *
 * Testa o fluxo completo de agendamento de downgrade:
 * - Verificação de planos disponíveis
 * - Modal de downgrade
 * - Cancelar modal
 * - Confirmar downgrade
 *
 * NOTA: Este teste precisa de usuário ULTRA com período ativo.
 */
test.describe('Downgrade Ultra to Pro', () => {
  let testUser: TestUserCredentials;
  let asaasCustomerId: string | null = null;

  test.beforeAll(async () => {
    const result = await ensureTestUserWithPlan('ultra');
    testUser = result.user;

    if (result.currentPlan !== 'ultra') {
      console.log(`[Downgrade] Aviso: usuário tem plano ${result.currentPlan}`);
    } else {
      console.log(`[Downgrade] Usuário Ultra encontrado: ${testUser.email}`);
    }

    // Busca asaas_customer_id para relatório
    const subscription = await getUserSubscription(testUser.id);
    asaasCustomerId = subscription?.asaas_customer_id || null;

    await setCurrentPeriodEnd(testUser.id, 30);
    await resetSubscriptionState(testUser.id);
  });

  test('deve permitir agendar downgrade de Ultra para Pro', async ({ page, request, testReport }) => {
    // Configura relatório
    testReport.setUser({
      email: testUser.email,
      password: testUser.password,
      id: testUser.id,
    });

    if (asaasCustomerId) {
      testReport.setAsaasCustomer({ id: asaasCustomerId });

      // Busca cobranças pendentes para relatório
      const payments = await findAsaasPaymentsByCustomer(request, asaasCustomerId);
      const pendingPayments = payments.data?.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE') || [];
      testReport.setInvoicesBefore(pendingPayments.map(p => ({
        id: p.id,
        value: p.value,
        status: p.status,
        dueDate: p.dueDate,
        description: p.description,
      })));
    }

    testReport.addAction('Iniciando teste de downgrade');

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

    // ========== PASSO 1: Verifica plano Pro disponível ==========
    testReport.addAction('Verificando plano Pro disponível');
    await expect(page.getByText('Pro', { exact: true }).first()).toBeVisible();
    const proButton = page.locator('button:has-text("Escolher plano")').first();
    await expect(proButton).toBeVisible();
    testReport.addAction('Plano Pro disponível para downgrade');
    await debugPause(page, 'long');

    // ========== PASSO 2: Abre modal de downgrade ==========
    testReport.addAction('Abrindo modal de downgrade');
    await pricingPage.selectMonthlyBilling();
    await debugPause(page, 'short');
    await page.waitForTimeout(500);
    await pricingPage.selectProPlan();
    await debugPause(page, 'short');

    // Verifica modal
    const modal = page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    await expect(modal.getByText(/continua até/i)).toBeVisible();
    await expect(modal.getByText(/Manter plano atual/i)).toBeVisible();
    await expect(modal.getByText(/Confirmar mudança/i)).toBeVisible();
    testReport.addAction('Modal de downgrade aberto');
    await debugPause(page, 'long');

    // ========== PASSO 3: Cancela o modal ==========
    testReport.addAction('Testando cancelamento do modal');
    await page.click('button:has-text("Manter plano atual")');
    await debugPause(page, 'short');
    await modal.waitFor({ state: 'hidden', timeout: 3000 });
    await expect(page).toHaveURL(/\/planos/);
    testReport.addAction('Modal fechado - permaneceu na página');
    await debugPause(page, 'medium');

    // ========== PASSO 4: Reabre e confirma downgrade ==========
    testReport.addAction('Reabrindo modal para confirmar');
    await pricingPage.selectMonthlyBilling();
    await debugPause(page, 'short');
    await page.waitForTimeout(500);
    await pricingPage.selectProPlan();
    await debugPause(page, 'short');

    // Aguarda modal novamente
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    await debugPause(page, 'medium');

    // Confirma downgrade
    testReport.addAction('Confirmando downgrade');
    await page.click('button:has-text("Confirmar mudança")');
    await debugPause(page, 'short');

    // Verifica toast de sucesso
    const toast = page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible', timeout: 10000 });
    const toastText = await toast.textContent();
    expect(toastText?.toLowerCase()).toContain('agendado');
    testReport.addAction('Downgrade agendado com sucesso', toastText || undefined);
    await debugPause(page, 'long');

    // Modal deve fechar
    await modal.waitFor({ state: 'hidden', timeout: 3000 });

    testReport.addNote('Downgrade de Ultra para Pro agendado');
    console.log('[Test] ✅ Downgrade agendado com sucesso');
  });
});
