import { test, expect } from '../fixtures/test-report';
import { ensureTestUserWithPlan, TestUserCredentials, setCurrentPeriodEnd, resetSubscriptionState, getUserSubscription } from '../routines/database';
import { findAsaasPaymentsByCustomer } from '../routines/api';
import { LoginPage } from '../pages/login.page';
import { navigateTo } from '../routines/navigation';
import { debugPause } from '../config/debug';

/**
 * Teste E2E #7: Cancel Subscription
 *
 * Testa o fluxo completo de cancelamento de assinatura:
 * - Verificação do botão de cancelar
 * - Modal de cancelamento
 * - Fechar modal sem cancelar
 * - Confirmar cancelamento
 * - VERIFICAÇÃO REAL: Cobranças pendentes canceladas no Asaas
 *
 * NOTA: Este teste precisa de usuário com plano pago (Pro ou Ultra).
 */
test.describe('Cancel Subscription', () => {
  let testUser: TestUserCredentials;
  let asaasCustomerId: string | null = null;

  test.beforeAll(async () => {
    const result = await ensureTestUserWithPlan('pro');
    testUser = result.user;

    if (result.currentPlan === 'free') {
      console.log(`[Cancel] Aviso: usuário tem plano free, não pode cancelar`);
    } else {
      console.log(`[Cancel] Usuário ${result.currentPlan} encontrado: ${testUser.email}`);
    }

    // Busca asaas_customer_id para verificações posteriores
    const subscription = await getUserSubscription(testUser.id);
    asaasCustomerId = subscription?.asaas_customer_id || null;
    console.log(`[Cancel] Asaas Customer ID: ${asaasCustomerId}`);

    await setCurrentPeriodEnd(testUser.id, 30);
    await resetSubscriptionState(testUser.id);
  });

  test('deve permitir cancelar assinatura e cancelar cobranças pendentes no Asaas', async ({ page, request, testReport }) => {
    // ========== SETUP: Configura relatório ==========
    testReport.setUser({
      email: testUser.email,
      password: testUser.password,
      id: testUser.id,
    });

    if (asaasCustomerId) {
      testReport.setAsaasCustomer({ id: asaasCustomerId });
    }

    // ========== SETUP: Verifica estado inicial no Asaas ==========
    let pendingBefore: Array<{ id: string; status: string; value: number; dueDate: string; description?: string }> = [];
    if (asaasCustomerId) {
      const payments = await findAsaasPaymentsByCustomer(request, asaasCustomerId);
      pendingBefore = payments.data?.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE') || [];
      console.log(`[Test] Cobranças pendentes ANTES do cancelamento: ${pendingBefore.length}`);

      testReport.setInvoicesBefore(pendingBefore.map(p => ({
        id: p.id,
        value: p.value,
        status: p.status,
        dueDate: p.dueDate,
        description: p.description,
      })));
    }

    // 1. Faz login
    testReport.addAction('Iniciando login');
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await page.waitForURL(/\/home/, { timeout: 15000 });
    testReport.addAction('Login realizado com sucesso');
    await debugPause(page, 'medium');

    // 2. Navega para página de cobranças
    testReport.addAction('Navegando para /cobrancas');
    await navigateTo(page, '/cobrancas');
    await debugPause(page, 'medium');

    // ========== PASSO 1: Verifica botão de cancelar ==========
    const cancelButton = page.locator('button:has-text("Cancelar assinatura")');
    await expect(cancelButton).toBeVisible({ timeout: 10000 });
    testReport.addAction('Botão "Cancelar assinatura" visível');
    await debugPause(page, 'long');

    // ========== PASSO 2: Abre modal de cancelamento ==========
    await cancelButton.click();
    testReport.addAction('Clicou em "Cancelar assinatura"');
    await debugPause(page, 'short');

    const modal = page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    await expect(modal.getByText(/Cancelar assinatura/i)).toBeVisible();
    await expect(modal.getByText(/Manter assinatura/i)).toBeVisible();
    await expect(modal.getByText(/Confirmar cancelamento/i)).toBeVisible();
    testReport.addAction('Modal de cancelamento aberto');
    await debugPause(page, 'long');

    // ========== PASSO 3: Fecha modal sem cancelar ==========
    await page.click('button:has-text("Manter assinatura")');
    testReport.addAction('Clicou em "Manter assinatura"', 'Testando fechamento do modal');
    await debugPause(page, 'short');
    await modal.waitFor({ state: 'hidden', timeout: 3000 });

    // Verifica que botão ainda está visível
    await expect(cancelButton).toBeVisible();
    testReport.addAction('Modal fechado, botão ainda visível');
    await debugPause(page, 'medium');

    // ========== PASSO 4: Reabre e confirma cancelamento ==========
    await cancelButton.click();
    testReport.addAction('Reabrindo modal de cancelamento');
    await debugPause(page, 'short');
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    await debugPause(page, 'medium');

    // Preenche motivo se campo existir
    const reasonInput = page.locator('textarea');
    if (await reasonInput.isVisible().catch(() => false)) {
      await reasonInput.fill('Teste E2E - cancelamento');
      testReport.addAction('Preencheu motivo do cancelamento');
      await debugPause(page, 'short');
    }

    // Confirma cancelamento
    await page.click('button:has-text("Confirmar cancelamento")');
    testReport.addAction('Clicou em "Confirmar cancelamento"');
    await debugPause(page, 'short');

    // Verifica toast de sucesso
    const toast = page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible', timeout: 10000 });
    const toastText = await toast.textContent();
    expect(toastText?.toLowerCase()).toContain('cancel');
    testReport.addAction('Toast de sucesso exibido', toastText || undefined);
    await debugPause(page, 'long');

    // Modal deve fechar
    await modal.waitFor({ state: 'hidden', timeout: 3000 });

    // Verifica mensagem de cancelamento agendado
    await page.waitForTimeout(1000);
    const cancelInfo = page.locator('text=/marcad[ao] para cancelamento/i');
    await expect(cancelInfo).toBeVisible({ timeout: 5000 });
    testReport.addAction('Mensagem "marcado para cancelamento" visível');
    await debugPause(page, 'long');

    // ========== VERIFICAÇÃO CRÍTICA: Cobranças canceladas no Asaas ==========
    if (asaasCustomerId && pendingBefore.length > 0) {
      testReport.addAction('Verificando cobranças no Asaas...');
      console.log(`[Test] Verificando se cobranças foram canceladas no Asaas...`);

      // Aguarda um momento para a API processar
      await page.waitForTimeout(2000);

      const paymentsAfter = await findAsaasPaymentsByCustomer(request, asaasCustomerId);
      const pendingAfter = paymentsAfter.data?.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE') || [];

      testReport.setInvoicesAfter(pendingAfter.map(p => ({
        id: p.id,
        value: p.value,
        status: p.status,
        dueDate: p.dueDate,
        description: p.description,
      })));

      console.log(`[Test] Cobranças pendentes APÓS cancelamento: ${pendingAfter.length}`);
      testReport.addAction(`Cobranças pendentes após cancelamento: ${pendingAfter.length}`);

      // ESTE É O TESTE CRÍTICO: Não deve haver cobranças pendentes após cancelar
      expect(
        pendingAfter.length === 0,
        `FALHA: Ainda existem ${pendingAfter.length} cobrança(s) pendente(s) no Asaas após cancelamento!`
      ).toBe(true);

      testReport.addAction('Todas as cobranças pendentes foram canceladas no Asaas');
      console.log('[Test] ✅ Todas as cobranças pendentes foram canceladas no Asaas');
    } else if (!asaasCustomerId) {
      testReport.addNote('Sem asaas_customer_id - não foi possível verificar no Asaas');
      console.log('[Test] ⚠️ Sem asaas_customer_id - não foi possível verificar no Asaas');
    } else {
      testReport.addNote('Não havia cobranças pendentes antes do cancelamento');
      console.log('[Test] ℹ️ Não havia cobranças pendentes antes do cancelamento');
    }

    testReport.addAction('Teste finalizado com sucesso');
    console.log('[Test] ✅ Assinatura cancelada com sucesso');
  });
});
