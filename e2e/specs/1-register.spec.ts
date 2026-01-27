import { test, expect } from '../fixtures/test-report';
import { confirmUserEmailByEmail, findUserByEmail } from '../routines/database';
import { RegisterPage } from '../pages/register.page';
import { LoginPage } from '../pages/login.page';
import { expectRedirect } from '../routines/assertions';
import { saveTestUser, clearTestUser } from '../state/shared-user';
import { debugPause } from '../config/debug';

/**
 * Teste E2E #1: Register User
 *
 * PRIMEIRO TESTE DA CADEIA REAL:
 * Register → Login → Profile → Subscribe → Upgrade
 *
 * Este teste CRIA o usuário que será usado por TODOS os outros testes.
 * Se este teste falhar, TODOS os outros falham também.
 */
test.describe('Register User', () => {
  const timestamp = Date.now();
  const testEmail = `e2e-chain-${timestamp}@test.ucomis.com`;
  const testPassword = 'Test@123456';

  test.beforeAll(async () => {
    clearTestUser();
  });

  test('deve permitir que um novo usuário se cadastre na plataforma', async ({ page, testReport }) => {
    // Configura relatório
    testReport.setUser({ email: testEmail, password: testPassword });
    testReport.addAction('Iniciando teste de registro');

    // 1. Acessa página de registro
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    testReport.addAction('Acessou página de registro');
    await debugPause(page, 'medium');

    // 2. Preenche formulário de cadastro
    await registerPage.fillForm({
      email: testEmail,
      password: testPassword,
    });
    testReport.addAction('Preencheu formulário', `Email: ${testEmail}`);
    await debugPause(page, 'short');

    // 3. Submete o formulário
    await registerPage.submit();
    testReport.addAction('Submeteu formulário');
    await debugPause(page, 'short');

    // 4. Aguarda resposta do servidor (toast)
    const toast = page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible', timeout: 15000 });
    await debugPause(page, 'long');

    const toastType = await toast.getAttribute('data-type');
    const toastText = await toast.textContent() || '';

    // 5. Se houver QUALQUER erro, o teste falha
    if (toastType === 'error') {
      testReport.addNote(`ERRO: ${toastText}`);
      throw new Error(`Cadastro falhou: ${toastText}`);
    }

    testReport.addAction('Cadastro realizado', toastText);

    // 6. Verifica se usuário foi criado no banco
    const user = await findUserByEmail(testEmail);
    expect(user, 'Usuário deveria existir no banco').toBeTruthy();
    expect(user?.email).toBe(testEmail);
    testReport.addAction('Usuário verificado no banco', `ID: ${user?.id}`);

    // 7. Confirma email via API (simula clique no link do email)
    await confirmUserEmailByEmail(testEmail);
    testReport.addAction('Email confirmado via API');
    await debugPause(page, 'medium');

    // 8. Faz login com as credenciais criadas
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await debugPause(page, 'medium');
    await loginPage.login(testEmail, testPassword);
    testReport.addAction('Realizou login com novas credenciais');
    await debugPause(page, 'short');

    // 9. Verifica se conseguiu acessar a plataforma
    await expectRedirect(page, '/home');
    testReport.addAction('Redirecionado para /home com sucesso');
    await debugPause(page, 'long');

    // 10. SALVA as credenciais para os próximos testes da cadeia
    saveTestUser({
      id: user!.id,
      email: testEmail,
      password: testPassword,
      plan: 'free',
    });

    testReport.addAction('Credenciais salvas para próximos testes');
    testReport.addNote('Este usuário será usado pelos testes 2-7 da cadeia');
    console.log('[Register] ✅ Usuário criado e salvo para cadeia de testes');
  });
});
