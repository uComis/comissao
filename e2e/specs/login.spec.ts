import { test, expect } from '@playwright/test';
import { ensureTestUser, TestUserCredentials } from '../routines/database';
import { LoginPage } from '../pages/login.page';
import { expectRedirect, expectText } from '../routines/assertions';
import { navigateTo } from '../routines/navigation';

/**
 * Teste E2E #2: Login User
 *
 * Testa o fluxo de login:
 * 1. Login com credenciais válidas
 * 2. Login com credenciais inválidas (deve mostrar erro)
 * 3. Verificar sessão ativa após login
 * 4. Verificar acesso a rotas protegidas
 *
 * NOTA: Este teste reutiliza usuário existente (qualquer plano serve para login)
 */
test.describe('Login User', () => {
  let testUser: TestUserCredentials;

  test.beforeAll(async () => {
    // Reutiliza usuário existente ou cria novo se não houver
    testUser = await ensureTestUser();
  });

  // Não faz cleanup - usuário pode ser reutilizado por outros testes

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    // 1. Acessa página de login
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // 2. Preenche e submete formulário
    await loginPage.login(testUser.email, testUser.password);

    // 3. Deve redirecionar para home
    await expectRedirect(page, '/home');

    // 4. Verifica se está logado (sessão ativa)
    // Tenta acessar uma rota protegida - não deve redirecionar para login
    await navigateTo(page, '/home');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('deve mostrar erro com email inválido', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Tenta login com email que não existe
    await loginPage.login('email-inexistente@teste.com', 'senha123');

    // Deve mostrar toast de erro
    const toast = page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible', timeout: 10000 });

    const toastType = await toast.getAttribute('data-type');
    expect(toastType).toBe('error');

    // Deve permanecer na página de login
    await expect(page).toHaveURL(/\/login/);
  });

  test('deve mostrar erro com senha incorreta', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Tenta login com senha errada
    await loginPage.login(testUser.email, 'senha-errada-123');

    // Deve mostrar toast de erro
    const toast = page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible', timeout: 10000 });

    const toastType = await toast.getAttribute('data-type');
    expect(toastType).toBe('error');

    // Deve permanecer na página de login
    await expect(page).toHaveURL(/\/login/);
  });

  test('deve redirecionar para login ao acessar rota protegida sem autenticação', async ({ page }) => {
    // Limpa qualquer sessão existente
    await page.context().clearCookies();

    // Tenta acessar rota protegida
    await navigateTo(page, '/home');

    // Deve redirecionar para login
    await expectRedirect(page, '/login');
  });
});
