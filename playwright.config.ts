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
 */
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
    baseURL: 'http://localhost:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 2560, height: 1440 },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 2560, height: 1440 },
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4000',
    reuseExistingServer: !process.env.CI,
  },
});
