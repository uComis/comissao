import { test, expect } from '../fixtures/test-report';
import { ProfilePage } from '../pages/profile.page';
import { LoginPage } from '../pages/login.page';
import { expectSuccessToast } from '../routines/assertions';
import { requireTestUser, SharedTestUser } from '../state/shared-user';
import { debugPause } from '../config/debug';

/**
 * Teste E2E #3: Update User Profile
 *
 * TERCEIRO TESTE DA CADEIA REAL:
 * Register → Login → Profile → Subscribe → Upgrade
 *
 * Este teste USA o usuário criado pelo teste de Register.
 * Se Register não rodou, este teste FALHA.
 */
test.describe('Update User Profile', () => {
  let testUser: SharedTestUser;

  test.beforeAll(async () => {
    testUser = requireTestUser();
  });

  test('deve validar dados e permitir atualizar perfil', async ({ page, testReport }) => {
    // Configura relatório
    testReport.setUser({
      email: testUser.email,
      password: testUser.password,
      id: testUser.id,
    });
    testReport.addAction('Iniciando teste de perfil');

    // 1. Faz login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await page.waitForURL(/\/home/, { timeout: 15000 });
    testReport.addAction('Login realizado com sucesso');
    await debugPause(page, 'medium');

    // 2. Navega para página de perfil
    const profilePage = new ProfilePage(page);
    await profilePage.goto();
    testReport.addAction('Navegou para página de perfil');
    await debugPause(page, 'medium');

    // ========== PASSO 1: Documento inválido ==========
    testReport.addAction('Testando documento inválido');
    await profilePage.openEditDialog();
    await debugPause(page, 'short');

    await profilePage.fillFullName('Teste Documento Inválido');
    await profilePage.fillDocument('1234567'); // CPF incompleto
    await debugPause(page, 'short');
    await profilePage.save();
    await debugPause(page, 'short');

    // Verifica toast de erro
    let toast = page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible', timeout: 10000 });
    expect(await toast.getAttribute('data-type')).toBe('error');
    testReport.addAction('Erro exibido para documento inválido');
    await debugPause(page, 'long');

    // Aguarda toast sumir
    await toast.waitFor({ state: 'hidden', timeout: 10000 });

    // ========== PASSO 2: Dados válidos ==========
    testReport.addAction('Testando dados válidos');
    // O modal ainda deve estar aberto após erro de validação
    // Mas se fechou, reabrimos
    if (!(await profilePage.isEditDialogOpen())) {
      await profilePage.openEditDialog();
      await debugPause(page, 'short');
    }

    const newName = 'Usuário Teste E2E';
    const newDocument = '12345678901';

    await profilePage.fillFullName(newName);
    await profilePage.fillDocument(newDocument);
    testReport.addAction('Preencheu dados válidos', `Nome: ${newName}`);
    await debugPause(page, 'short');
    await profilePage.save();
    await debugPause(page, 'short');

    // Verifica toast de sucesso
    await expectSuccessToast(page, 'Perfil atualizado com sucesso');
    testReport.addAction('Perfil atualizado com sucesso');
    await debugPause(page, 'long');

    // Aguarda o modal fechar
    await page.waitForTimeout(1000);

    // Recarrega para confirmar persistência
    await page.reload();
    await page.waitForLoadState('networkidle');
    testReport.addAction('Página recarregada para verificar persistência');
    await debugPause(page, 'medium');

    // Verifica que os dados foram salvos
    const displayedName = await profilePage.getDisplayedName();
    expect(displayedName).toContain(newName);
    testReport.addAction('Dados persistidos corretamente', `Nome exibido: ${displayedName}`);
    await debugPause(page, 'long');

    testReport.addNote('Teste de perfil completo: validações e persistência');
    console.log('[Profile] ✅ Teste de perfil completo');
  });
});
