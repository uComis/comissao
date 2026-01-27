import { Page } from '@playwright/test';

/**
 * Modo Debug Visual para Testes E2E
 *
 * Quando ativado (E2E_DEBUG=true), adiciona pausas nos testes
 * para permitir visualização do que está acontecendo.
 *
 * Uso:
 *   - Normal: npm run e2e (sem pausas)
 *   - Debug:  E2E_DEBUG=true npm run e2e (com pausas)
 *   - Ou use os .bat: e2e/run/all-debug.bat
 */

export const DEBUG_MODE = process.env.E2E_DEBUG === 'true';

/**
 * Tempos de pausa em milissegundos
 * - short: após cliques, preenchimento de campos
 * - medium: após navegação, mudança de página
 * - long: para ler mensagens, toasts, verificar estado
 */
export const PAUSE_TIMES = {
  short: DEBUG_MODE ? 300 : 0,
  medium: DEBUG_MODE ? 800 : 0,
  long: DEBUG_MODE ? 2500 : 0,
};

type PauseType = keyof typeof PAUSE_TIMES;

/**
 * Pausa para debug visual
 *
 * @example
 * await debugPause(page, 'short');  // após clique
 * await debugPause(page, 'medium'); // após navegação
 * await debugPause(page, 'long');   // para ler toast
 */
export async function debugPause(page: Page, type: PauseType): Promise<void> {
  const time = PAUSE_TIMES[type];
  if (time > 0) {
    await page.waitForTimeout(time);
  }
}

/**
 * Log condicional para modo debug
 */
export function debugLog(message: string): void {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`);
  }
}

// Log inicial se modo debug estiver ativo
if (DEBUG_MODE) {
  console.log('============================================');
  console.log('  MODO DEBUG VISUAL ATIVADO');
  console.log('  Pausas: short=300ms, medium=800ms, long=2.5s');
  console.log('============================================');
}
