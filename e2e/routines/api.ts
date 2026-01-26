import { Page, APIRequestContext } from '@playwright/test';

/**
 * Configuração da API Asaas para testes
 * Usa as mesmas variáveis do ambiente (local/dev já aponta para sandbox)
 */
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

// Processa a API key igual à aplicação faz (asaas-service.ts)
function getAsaasApiKey(): string {
  let apiKey = process.env.ASAAS_API_KEY || '';

  // Remove aspas caso o processo as tenha lido como parte da string
  apiKey = apiKey.replace(/^["']|["']$/g, '');

  // TRATAMENTO PARA O SÍMBOLO $:
  // Se a chave vier com [S] (placeholder para evitar erro do Next.js), trocamos de volta para $
  apiKey = apiKey.replaceAll('[S]', '$');

  return apiKey;
}

const ASAAS_API_KEY = getAsaasApiKey();

/**
 * Faz uma chamada à API do Asaas
 */
export async function callAsaasApi(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: Record<string, unknown>
): Promise<unknown> {
  const url = `${ASAAS_API_URL}${endpoint}`;
  console.log(`[Asaas API] ${method} ${url}`);

  const response = await request.fetch(url, {
    method,
    headers: {
      'access_token': ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
    data: data ? JSON.stringify(data) : undefined,
  });

  const responseData = await response.json();

  if (!response.ok()) {
    console.error(`[Asaas API] Error ${response.status()}:`, JSON.stringify(responseData));
    throw new Error(`Asaas API error: ${response.status()} - ${JSON.stringify(responseData)}`);
  }

  console.log(`[Asaas API] Response:`, JSON.stringify(responseData).substring(0, 200));
  return responseData;
}

/**
 * Simula confirmação de pagamento no Asaas (sandbox)
 * Usa o endpoint receiveInCash para marcar como pago
 *
 * @param paymentDate - Data do pagamento (usar dueDate do payment para evitar erro de data)
 */
export async function simulatePaymentConfirmation(
  request: APIRequestContext,
  paymentId: string,
  value?: number,
  paymentDate?: string
): Promise<void> {
  const payload: Record<string, unknown> = {
    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
  };

  // Só passa o valor se for informado (caso contrário usa o valor original do pagamento)
  if (value && value > 0) {
    payload.value = value;
  }

  await callAsaasApi(request, 'POST', `/payments/${paymentId}/receiveInCash`, payload);
}

/**
 * Busca customer no Asaas por email
 */
export async function findAsaasCustomerByEmail(
  request: APIRequestContext,
  email: string
): Promise<unknown> {
  return callAsaasApi(request, 'GET', `/customers?email=${encodeURIComponent(email)}`);
}

/**
 * Busca customer no Asaas por CPF/CNPJ
 */
export async function findAsaasCustomerByCpfCnpj(
  request: APIRequestContext,
  cpfCnpj: string
): Promise<unknown> {
  // Remove formatação do CPF/CNPJ
  const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');
  return callAsaasApi(request, 'GET', `/customers?cpfCnpj=${cleanCpfCnpj}`);
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
 * Busca pagamentos de uma subscription no Asaas
 */
export async function findAsaasPaymentsBySubscription(
  request: APIRequestContext,
  subscriptionId: string
): Promise<{ data: Array<{ id: string; status: string; value: number; dueDate: string }> }> {
  return callAsaasApi(request, 'GET', `/payments?subscription=${subscriptionId}`) as Promise<{ data: Array<{ id: string; status: string; value: number; dueDate: string }> }>;
}

/**
 * Busca o primeiro pagamento PENDING de uma subscription
 */
export async function findPendingPayment(
  request: APIRequestContext,
  subscriptionId: string
): Promise<{ id: string; status: string; value: number; dueDate: string } | null> {
  const payments = await findAsaasPaymentsBySubscription(request, subscriptionId);
  return payments.data?.find(p => p.status === 'PENDING') || null;
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
