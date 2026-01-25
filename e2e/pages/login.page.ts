import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { fillInputByPlaceholder, clickButton } from '../routines';

/**
 * Page Object para a página de Login
 */
export class LoginPage extends BasePage {
  get path(): string {
    return '/login';
  }

  /**
   * Preenche o formulário de login e submete
   */
  async login(email: string, password: string): Promise<void> {
    await fillInputByPlaceholder(this.page, 'Email', email);
    await fillInputByPlaceholder(this.page, 'Senha', password);
    await clickButton(this.page, 'Entrar');
  }

  /**
   * Clica no link para criar conta
   */
  async goToRegister(): Promise<void> {
    await this.page.click('a:has-text("Criar conta")');
  }

  /**
   * Clica no link de esqueci minha senha
   */
  async goToForgotPassword(): Promise<void> {
    await this.page.click('a:has-text("Esqueci minha senha")');
  }
}
