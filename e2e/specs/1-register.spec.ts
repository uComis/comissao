import { test, expect } from '@playwright/test';
import { cleanupTestUser, confirmUserEmailByEmail, findUserByEmail } from '../routines/database';
import { RegisterPage } from '../pages/register.page';
import { LoginPage } from '../pages/login.page';
import { expectRedirect } from '../routines/assertions';
import { saveTestUser, clearTestUser } from '../state/shared-user';

/**
 * Teste E2E #1: Register User
 *
 * PRIMEIRO TESTE DA CADEIA REAL:
 * Register → Login → Profile → Subscribe → Upgrade
 *
 * Este teste CRIA o usuário que será usado por TODOS os outros testes.
 * Se este teste falhar, TODOS os outros falham também.
 *
 * Fluxo:
 * 1. Preenche formulário de cadastro via UI
 * 2. Verifica envio de email (se falhar, teste falha)
 * 3. Confirma email via API (simulação justificável - não tem como clicar no email)
 * 4. Faz login com as credenciais criadas
 * 5. Verifica acesso à plataforma
 * 6. SALVA as credenciais para os próximos testes
 */
test.describe('Register User', () => {
  const timestamp = Date.now();
  const testEmail = `e2e-chain-${timestamp}@test.ucomis.com`;
  const testPassword = 'Test@123456';

  test.beforeAll(async () => {
    // Limpa estado anterior para garantir cadeia limpa
    clearTestUser();
  });

  // NÃO faz cleanup - o usuário será reutilizado pelos próximos testes
  // O cleanup acontece quando uma nova cadeia começa (beforeAll acima)

  test('deve permitir que um novo usuário se cadastre na plataforma', async ({ page }) => {
    // 1. Acessa página de registro
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    // 2. Preenche formulário de cadastro
    await registerPage.fillForm({
      email: testEmail,
      password: testPassword,
    });

    // 3. Submete o formulário
    await registerPage.submit();

    // 4. Aguarda resposta do servidor (toast)
    const toast = page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible', timeout: 15000 });

    const toastType = await toast.getAttribute('data-type');
    const toastText = await toast.textContent() || '';

    // 5. Se houver QUALQUER erro, o teste falha
    //    (inclui erro de email - se email não funciona, usuário não consegue se cadastrar!)
    if (toastType === 'error') {
      throw new Error(`Cadastro falhou: ${toastText}`);
    }

    // 6. Verifica se usuário foi criado no banco
    const user = await findUserByEmail(testEmail);
    expect(user, 'Usuário deveria existir no banco').toBeTruthy();
    expect(user?.email).toBe(testEmail);

    // 7. Confirma email via API (simula clique no link do email)
    // SIMULAÇÃO JUSTIFICÁVEL: Não tem como automatizar clique em email real
    await confirmUserEmailByEmail(testEmail);

    // 8. Faz login com as credenciais criadas
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testEmail, testPassword);

    // 9. Verifica se conseguiu acessar a plataforma
    await expectRedirect(page, '/home');

    // 10. SALVA as credenciais para os próximos testes da cadeia
    saveTestUser({
      id: user!.id,
      email: testEmail,
      password: testPassword,
      plan: 'free',
    });

    console.log('[Register] ✅ Usuário criado e salvo para cadeia de testes');
  });
});
