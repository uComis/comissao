import { test, expect } from '../fixtures/test-report';
import { LoginPage } from '../pages/login.page';
import { expectRedirect } from '../routines/assertions';
import { navigateTo } from '../routines/navigation';
import { requireTestUser, SharedTestUser } from '../state/shared-user';
import { debugPause } from '../config/debug';

/**
 * Teste E2E #2: Login User
 *
 * SEGUNDO TESTE DA CADEIA REAL:
 * Register → Login → Profile → Subscribe → Upgrade
 *
 * Este teste USA o usuário criado pelo teste de Register.
 * Se Register não rodou, este teste FALHA.
 */
test.describe('Login User', () => {
  let testUser: SharedTestUser;

  test.beforeAll(async () => {
    testUser = requireTestUser();
  });

  test('deve validar credenciais e fazer login com sucesso', async ({ page, testReport }) => {
    // Configura relatório
    testReport.setUser({
      email: testUser.email,
      password: testUser.password,
      id: testUser.id,
    });
    testReport.addAction('Iniciando teste de login');

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    testReport.addAction('Acessou página de login');
    await debugPause(page, 'medium');

    // ========== PASSO 1: Email inválido ==========
    testReport.addAction('Testando email inválido');
    await loginPage.login('email-inexistente@teste.com', 'senha123');
    await debugPause(page, 'short');

    // Verifica toast de erro
    let toast = page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible', timeout: 10000 });
    expect(await toast.getAttribute('data-type')).toBe('error');
    testReport.addAction('Erro exibido para email inválido');
    await debugPause(page, 'long');

    // Deve permanecer na página de login
    await expect(page).toHaveURL(/\/login/);

    // Aguarda toast sumir antes de continuar
    await toast.waitFor({ state: 'hidden', timeout: 10000 });

    // ========== PASSO 2: Email correto, senha incorreta ==========
    testReport.addAction('Testando senha incorreta');
    await loginPage.login(testUser.email, 'senha-errada-123');
    await debugPause(page, 'short');

    // Verifica toast de erro
    toast = page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible', timeout: 10000 });
    expect(await toast.getAttribute('data-type')).toBe('error');
    testReport.addAction('Erro exibido para senha incorreta');
    await debugPause(page, 'long');

    // Deve permanecer na página de login
    await expect(page).toHaveURL(/\/login/);

    // Aguarda toast sumir
    await toast.waitFor({ state: 'hidden', timeout: 10000 });

    // ========== PASSO 3: Credenciais corretas ==========
    testReport.addAction('Testando credenciais corretas');
    await loginPage.login(testUser.email, testUser.password);
    await debugPause(page, 'short');

    // Deve redirecionar para home
    await expectRedirect(page, '/home');
    testReport.addAction('Login realizado com sucesso', 'Redirecionado para /home');
    await debugPause(page, 'medium');

    // Verifica sessão ativa
    await navigateTo(page, '/home');
    await expect(page).not.toHaveURL(/\/login/);
    testReport.addAction('Sessão verificada - usuário permanece logado');
    await debugPause(page, 'long');

    testReport.addNote('Teste de login completo: validações e sucesso');
    console.log('[Login] ✅ Teste de login completo');
  });

  test('deve redirecionar para login ao acessar rota protegida sem autenticação', async ({ page, testReport }) => {
    // Configura relatório
    testReport.addAction('Iniciando teste de proteção de rotas');

    // Limpa qualquer sessão existente
    await page.context().clearCookies();
    testReport.addAction('Cookies limpos');

    // Tenta acessar rota protegida
    await navigateTo(page, '/home');
    testReport.addAction('Tentativa de acesso a /home sem autenticação');
    await debugPause(page, 'medium');

    // Deve redirecionar para login
    await expectRedirect(page, '/login');
    testReport.addAction('Redirecionado para /login corretamente');
    await debugPause(page, 'long');

    testReport.addNote('Proteção de rotas funcionando');
    console.log('[Login] ✅ Proteção de rotas verificada');
  });
});
