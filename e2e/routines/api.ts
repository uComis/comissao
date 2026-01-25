import { Page, APIRequestContext } from '@playwright/test';

/**
 * Configuração da API Asaas para testes
 */
const ASAAS_SANDBOX_URL = process.env.ASAAS_SANDBOX_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';

/**
 * Faz uma chamada à API do Asaas
 */
export async function callAsaasApi(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: Record<string, unknown>
): Promise<unknown> {
  const response = await request.fetch(`${ASAAS_SANDBOX_URL}${endpoint}`, {
    method,
    headers: {
      'access_token': ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
    data: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
}

/**
 * Simula confirmação de pagamento no Asaas (sandbox)
 */
export async function simulatePaymentConfirmation(
  request: APIRequestContext,
  paymentId: string
): Promise<void> {
  await callAsaasApi(request, 'POST', `/payments/${paymentId}/receiveInCash`, {
    paymentDate: new Date().toISOString().split('T')[0],
    value: 0, // Usa valor original
  });
}

/**
 * Busca customer no Asaas por email
 */
export async function findAsaasCustomerByEmail(
  request: APIRequestContext,
  email: string
): Promise<unknown> {
  return callAsaasApi(request, 'GET', `/customers?email=${email}`);
}

/**
 * Busca subscription no Asaas por customer
 */
export async function findAsaasSubscription(
  request: APIRequestContext,
  customerId: string
): Promise<unknown> {
  return callAsaasApi(request, 'GET', `/subscriptions?customer=${customerId}`);
}

/**
 * Cancela subscription no Asaas
 */
export async function cancelAsaasSubscription(
  request: APIRequestContext,
  subscriptionId: string
): Promise<void> {
  await callAsaasApi(request, 'DELETE', `/subscriptions/${subscriptionId}`);
}

/**
 * Aguarda processamento de webhook (polling)
 */
export async function waitForWebhookProcessing(
  page: Page,
  timeoutMs: number = 10000
): Promise<void> {
  // Aguarda um tempo para o webhook ser processado
  // Em produção, podemos implementar polling mais inteligente
  await page.waitForTimeout(timeoutMs);
}
