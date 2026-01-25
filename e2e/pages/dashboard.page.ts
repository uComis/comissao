import { Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object para a página de Dashboard
 */
export class DashboardPage extends BasePage {
  get path(): string {
    return '/dashboard';
  }

  /**
   * Verifica se o usuário está no dashboard
   */
  async isVisible(): Promise<boolean> {
    return this.page.url().includes('/dashboard');
  }

  /**
   * Obtém o nome do usuário logado (se exibido)
   */
  async getUserName(): Promise<string | null> {
    const nameElement = this.page.locator('[data-testid="user-name"]');
    if (await nameElement.isVisible()) {
      return nameElement.textContent();
    }
    return null;
  }

  /**
   * Obtém o plano atual do usuário
   */
  async getCurrentPlan(): Promise<string | null> {
    const planElement = this.page.locator('[data-testid="current-plan"]');
    if (await planElement.isVisible()) {
      return planElement.textContent();
    }
    return null;
  }

  /**
   * Navega para a página de perfil
   */
  async goToProfile(): Promise<void> {
    await this.page.click('[data-testid="profile-link"]');
  }

  /**
   * Navega para a página de planos
   */
  async goToPricing(): Promise<void> {
    await this.page.click('[data-testid="pricing-link"]');
  }

  /**
   * Faz logout
   */
  async logout(): Promise<void> {
    await this.page.click('[data-testid="logout-button"]');
  }
}
