import { Page } from '@playwright/test';
import { navigateTo, waitForPageLoad } from '../routines';

/**
 * Classe base para todas as Page Objects
 * Contém funcionalidades comuns a todas as páginas
 */
export abstract class BasePage {
  constructor(protected page: Page) {}

  /**
   * Path da página (deve ser implementado por cada page)
   */
  abstract get path(): string;

  /**
   * Navega para esta página
   */
  async goto(): Promise<void> {
    await navigateTo(this.page, this.path);
  }

  /**
   * Aguarda carregamento da página
   */
  async waitForLoad(): Promise<void> {
    await waitForPageLoad(this.page);
  }

  /**
   * Retorna a URL atual
   */
  getCurrentUrl(): string {
    return this.page.url();
  }
}
