import { Page } from '@playwright/test';
import { navigateTo } from './navigation';
import { fillInput, clickButton } from './form';
import { expectRedirect } from './assertions';

/**
 * Dados de um usuário de teste
 */
export interface TestUser {
  email: string;
  password: string;
  name?: string;
  document?: string;
}

/**
 * Gera um usuário de teste com email único
 */
export function generateTestUser(prefix: string = 'test'): TestUser {
  const timestamp = Date.now();
  return {
    email: `${prefix}-${timestamp}@test.com`,
    password: 'Test@123456',
    name: `Test User ${timestamp}`,
    document: '12345678901',
  };
}

/**
 * Faz login com credenciais fornecidas
 */
export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await navigateTo(page, '/login');
  await fillInput(page, 'email', email);
  await fillInput(page, 'password', password);
  await clickButton(page, 'Entrar');
}

/**
 * Faz logout do usuário atual
 */
export async function logout(page: Page): Promise<void> {
  // TODO: Implementar quando soubermos como é o logout na UI
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await navigateTo(page, '/login');
}

/**
 * Verifica se existe sessão ativa
 */
export async function hasActiveSession(page: Page): Promise<boolean> {
  // TODO: Ajustar conforme implementação real de sessão
  const cookies = await page.context().cookies();
  return cookies.some(c => c.name.includes('supabase'));
}

/**
 * Garante que nenhum usuário está logado
 */
export async function ensureLoggedOut(page: Page): Promise<void> {
  const hasSession = await hasActiveSession(page);
  if (hasSession) {
    await logout(page);
  }
}

/**
 * Limpa todos os dados de autenticação
 */
export async function clearAuthData(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.context().clearCookies();
}
