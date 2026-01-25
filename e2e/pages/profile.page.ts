import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { fillInputById, clickButton } from '../routines';

/**
 * Page Object para a página de Perfil (/minhaconta/perfil)
 */
export class ProfilePage extends BasePage {
  get path(): string {
    return '/minhaconta/perfil';
  }

  /**
   * Abre o modal/drawer de edição de perfil
   */
  async openEditDialog(): Promise<void> {
    // Clica no botão de editar (ícone de lápis)
    await this.page.click('button:has(svg.lucide-pencil)');
    // Aguarda o dialog/drawer abrir
    await this.page.waitForSelector('[role="dialog"], [role="presentation"]', { state: 'visible' });
  }

  /**
   * Preenche o nome completo no formulário de edição
   */
  async fillFullName(name: string): Promise<void> {
    await fillInputById(this.page, 'fullName', name);
  }

  /**
   * Preenche o documento (CPF/CNPJ) no formulário de edição
   */
  async fillDocument(document: string): Promise<void> {
    await fillInputById(this.page, 'document', document);
  }

  /**
   * Salva as alterações do perfil
   */
  async save(): Promise<void> {
    await clickButton(this.page, 'Salvar Alterações');
  }

  /**
   * Fluxo completo: abre modal, atualiza nome e documento, salva
   */
  async updateProfile(fullName: string, document: string): Promise<void> {
    await this.openEditDialog();
    await this.fillFullName(fullName);
    await this.fillDocument(document);
    await this.save();
  }

  /**
   * Verifica se o nome está visível na página
   */
  async getDisplayedName(): Promise<string | null> {
    const nameElement = this.page.locator('h3.text-xl.font-semibold');
    return nameElement.textContent();
  }

  /**
   * Verifica se o documento está visível na página
   */
  async getDisplayedDocument(): Promise<string | null> {
    const documentElement = this.page.locator('p:has-text("Número") + p, div:has(p:text("Número")) p.font-medium').last();
    const text = await documentElement.textContent();
    return text;
  }
}
