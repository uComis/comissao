import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { fillInputByPlaceholder, clickButton } from '../routines';
import { TestUser } from '../routines/auth';

/**
 * Page Object para a página de Registro
 */
export class RegisterPage extends BasePage {
  get path(): string {
    return '/auth/cadastro';
  }

  /**
   * Preenche o formulário de registro completo
   */
  async fillForm(user: TestUser): Promise<void> {
    await fillInputByPlaceholder(this.page, 'Email', user.email);
    await fillInputByPlaceholder(this.page, 'Senha (mínimo 6 caracteres)', user.password);
    await fillInputByPlaceholder(this.page, 'Confirme sua senha', user.password);
  }

  /**
   * Submete o formulário de registro
   */
  async submit(): Promise<void> {
    await clickButton(this.page, 'Criar conta');
  }

  /**
   * Preenche e submete o formulário
   */
  async register(user: TestUser): Promise<void> {
    await this.fillForm(user);
    await this.submit();
  }

  /**
   * Clica no link para fazer login
   */
  async goToLogin(): Promise<void> {
    await this.page.click('a:has-text("Fazer login")');
  }
}
