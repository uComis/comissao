import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { clickButton, fillInputById } from '../routines';

/**
 * Page Object para a página de Planos (/planos)
 */
export class PricingPage extends BasePage {
  get path(): string {
    return '/planos';
  }

  /**
   * Seleciona o intervalo de cobrança mensal
   */
  async selectMonthlyBilling(): Promise<void> {
    await this.page.click('button:has-text("Mensal")');
  }

  /**
   * Seleciona o intervalo de cobrança anual
   */
  async selectYearlyBilling(): Promise<void> {
    await this.page.click('button:has-text("Anual")');
  }

  /**
   * Clica no botão "Escolher plano" do card que contém o nome do plano
   */
  async selectPlan(planName: string): Promise<void> {
    // Localiza o card que contém o nome do plano e clica no botão
    const planCard = this.page.locator(`div:has(h3:text("${planName}"), [class*="CardTitle"]:text("${planName}"))`);
    await planCard.locator('button:has-text("Escolher plano")').click();
  }

  /**
   * Seleciona o plano Pro
   */
  async selectProPlan(): Promise<void> {
    await this.selectPlan('Pro');
  }

  /**
   * Seleciona o plano Ultra
   */
  async selectUltraPlan(): Promise<void> {
    await this.selectPlan('Ultra');
  }

  /**
   * Verifica se está na página de confirmação
   */
  async isOnConfirmPage(): Promise<boolean> {
    return this.page.url().includes('/planos/confirmar');
  }
}

/**
 * Page Object para a página de Confirmação de Plano (/planos/confirmar)
 */
export class ConfirmPlanPage extends BasePage {
  get path(): string {
    return '/planos/confirmar';
  }

  /**
   * Preenche o nome completo
   */
  async fillFullName(name: string): Promise<void> {
    await fillInputById(this.page, 'fullName', name);
  }

  /**
   * Preenche o documento (CPF/CNPJ)
   */
  async fillDocument(document: string): Promise<void> {
    await fillInputById(this.page, 'document', document);
  }

  /**
   * Confirma a assinatura
   */
  async confirm(): Promise<void> {
    await clickButton(this.page, 'Confirmar e Pagar');
  }

  /**
   * Fluxo completo de confirmação
   */
  async confirmSubscription(fullName: string, document: string): Promise<void> {
    await this.fillFullName(fullName);
    await this.fillDocument(document);
    await this.confirm();
  }

  /**
   * Retorna o nome do plano exibido no resumo
   */
  async getPlanName(): Promise<string | null> {
    const planNameElement = this.page.locator('text=Plano selecionado >> .. >> span.font-semibold');
    return planNameElement.textContent();
  }
}
