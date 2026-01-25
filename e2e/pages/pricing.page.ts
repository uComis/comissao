import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { clickButton } from '../routines';

/**
 * Page Object para a página de Pricing/Planos
 */
export class PricingPage extends BasePage {
  get path(): string {
    return '/pricing';
  }

  /**
   * Seleciona o plano Pro
   */
  async selectProPlan(): Promise<void> {
    await clickButton(this.page, 'Assinar Pro');
  }

  /**
   * Seleciona o plano Ultra
   */
  async selectUltraPlan(): Promise<void> {
    await clickButton(this.page, 'Assinar Ultra');
  }

  /**
   * Verifica se o plano atual está destacado
   */
  async getCurrentPlan(): Promise<string | null> {
    const currentPlanBadge = this.page.locator('[data-testid="current-plan"]');
    if (await currentPlanBadge.isVisible()) {
      return currentPlanBadge.textContent();
    }
    return null;
  }
}
