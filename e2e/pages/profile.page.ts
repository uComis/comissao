import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { fillInput, clickButton } from '../routines';

/**
 * Page Object para a página de Perfil
 */
export class ProfilePage extends BasePage {
  get path(): string {
    return '/profile';
  }

  /**
   * Atualiza o nome do usuário
   */
  async updateName(name: string): Promise<void> {
    await fillInput(this.page, 'name', name);
  }

  /**
   * Atualiza o documento (CPF/CNPJ)
   */
  async updateDocument(document: string): Promise<void> {
    await fillInput(this.page, 'document', document);
  }

  /**
   * Salva as alterações do perfil
   */
  async save(): Promise<void> {
    await clickButton(this.page, 'Salvar');
  }

  /**
   * Atualiza nome e documento e salva
   */
  async updateProfile(name: string, document: string): Promise<void> {
    await this.updateName(name);
    await this.updateDocument(document);
    await this.save();
  }

  /**
   * Navega para a seção de assinatura
   */
  async goToSubscription(): Promise<void> {
    await this.page.click('a:has-text("Assinatura")');
  }
}
