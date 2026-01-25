import { test, expect } from '@playwright/test';
import { cleanupTestUser, confirmUserEmailByEmail, findUserByEmail } from '../routines/database';
import { RegisterPage } from '../pages/register.page';
import { LoginPage } from '../pages/login.page';
import { expectRedirect } from '../routines/assertions';

/**
 * Teste E2E #1: Register User
 *
 * Testa o fluxo COMPLETO de registro de usuário:
 * 1. Preenche formulário de cadastro
 * 2. Verifica envio de email (se falhar, teste falha)
 * 3. Confirma email (simula clique no link)
 * 4. Faz login com as credenciais criadas
 * 5. Verifica acesso à plataforma
 */
test.describe('Register User', () => {
  const timestamp = Date.now();
  const testEmail = `e2e-register-${timestamp}@test.ucomis.com`;
  const testPassword = 'Test@123456';

  test.afterAll(async () => {
    await cleanupTestUser(testEmail);
  });

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
    await confirmUserEmailByEmail(testEmail);

    // 8. Faz login com as credenciais criadas
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testEmail, testPassword);

    // 9. Verifica se conseguiu acessar a plataforma
    await expectRedirect(page, '/home');
  });
});
