import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis de ambiente do .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Configuração do Playwright para testes E2E
 *
 * CADEIA REAL DE TESTES:
 * Os testes formam uma cadeia onde cada um depende do anterior:
 *   1-register → 2-login → 3-profile → 4-subscribe → 5-upgrade → 6-downgrade → 7-cancel
 *
 * Se Register falhar, TODOS os outros falham.
 * Isso garante que testamos o fluxo REAL do usuário.
 *
 * IMPORTANTE: fullyParallel: false garante execução sequencial
 *
 * AMBIENTES:
 * - E2E_BASE_URL=http://localhost:4000 → Testa localmente (inicia servidor)
 * - E2E_BASE_URL=https://dev.ucomis.com → Testa no ambiente DEV (não inicia servidor)
 * - Produção está BLOQUEADA para evitar acidentes
 */

// URL base para os testes
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:4000';

// PROTEÇÃO: Bloqueia execução em produção (apenas domínios de PROD)
const BLOCKED_URLS = [
  'app.ucomis.com',
  'www.ucomis.com',
  '://ucomis.com', // Apenas o domínio raiz, não subdomínios como dev.ucomis.com
];

const isBlockedUrl = BLOCKED_URLS.some(blocked => baseURL.includes(blocked));
if (isBlockedUrl) {
  throw new Error(
    `🚫 BLOQUEADO: Testes E2E não podem rodar em produção!\n` +
    `   URL detectada: ${baseURL}\n` +
    `   Use E2E_BASE_URL=http://localhost:4000 ou https://dev.ucomis.com`
  );
}

// Detecta se é ambiente local (precisa iniciar o servidor)
const isLocalhost = baseURL.includes('localhost') || baseURL.includes('127.0.0.1');

export default defineConfig({
  testDir: './e2e/specs',

  // SEQUENCIAL: Garante que os testes rodem em ordem
  // Os arquivos são ordenados alfabeticamente pelo prefixo numérico
  fullyParallel: false,
  workers: 1, // Um worker garante execução sequencial

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',

  // Timeout mais generoso para testes E2E reais
  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // webServer só é configurado para ambiente local
  ...(isLocalhost
    ? {
        webServer: {
          command: 'npm run dev',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
        },
      }
    : {}),
});
