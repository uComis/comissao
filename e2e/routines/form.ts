import { Page } from '@playwright/test';

/**
 * Preenche um input pelo data-testid
 */
export async function fillInput(page: Page, testId: string, value: string): Promise<void> {
  await page.fill(`[data-testid="${testId}"]`, value);
}

/**
 * Preenche um input pelo placeholder
 */
export async function fillInputByPlaceholder(page: Page, placeholder: string, value: string): Promise<void> {
  await page.fill(`[placeholder="${placeholder}"]`, value);
}

/**
 * Preenche um input pelo label
 */
export async function fillInputByLabel(page: Page, label: string, value: string): Promise<void> {
  await page.getByLabel(label).fill(value);
}

/**
 * Clica em um botão pelo texto
 */
export async function clickButton(page: Page, text: string): Promise<void> {
  await page.click(`button:has-text("${text}")`);
}

/**
 * Clica em um botão pelo data-testid
 */
export async function clickButtonByTestId(page: Page, testId: string): Promise<void> {
  await page.click(`[data-testid="${testId}"]`);
}

/**
 * Clica em um link pelo texto
 */
export async function clickLink(page: Page, text: string): Promise<void> {
  await page.click(`a:has-text("${text}")`);
}

/**
 * Seleciona uma opção em um select
 */
export async function selectOption(page: Page, testId: string, value: string): Promise<void> {
  await page.selectOption(`[data-testid="${testId}"]`, value);
}

/**
 * Marca um checkbox pelo data-testid
 */
export async function checkCheckbox(page: Page, testId: string): Promise<void> {
  await page.check(`[data-testid="${testId}"]`);
}

/**
 * Desmarca um checkbox pelo data-testid
 */
export async function uncheckCheckbox(page: Page, testId: string): Promise<void> {
  await page.uncheck(`[data-testid="${testId}"]`);
}
