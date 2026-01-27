/**
 * Script para limpar cobranças pendentes órfãs no Asaas
 *
 * Uso: npx ts-node e2e/scripts/cleanup-pending-payments.ts
 */

import 'dotenv/config';

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

function getAsaasApiKey(): string {
  let apiKey = process.env.ASAAS_API_KEY || '';
  apiKey = apiKey.replace(/^["']|["']$/g, '');
  apiKey = apiKey.replaceAll('[S]', '$');
  return apiKey;
}

const ASAAS_API_KEY = getAsaasApiKey();

interface Payment {
  id: string;
  status: string;
  value: number;
  dueDate: string;
  description?: string;
  subscription?: string;
}

interface ListResponse {
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: Payment[];
}

async function callAsaasApi<T>(
  method: 'GET' | 'DELETE',
  endpoint: string
): Promise<T> {
  const url = `${ASAAS_API_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'access_token': ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Asaas API error: ${response.status} - ${JSON.stringify(data)}`);
  }

  return data as T;
}

async function getAllPendingPayments(customerId: string): Promise<Payment[]> {
  const allPayments: Payment[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  console.log(`\nBuscando cobranças do cliente ${customerId}...`);

  while (hasMore) {
    const response = await callAsaasApi<ListResponse>(
      'GET',
      `/payments?customer=${customerId}&limit=${limit}&offset=${offset}`
    );

    const pending = response.data.filter(p =>
      p.status === 'PENDING' || p.status === 'OVERDUE'
    );

    allPayments.push(...pending);

    hasMore = response.hasMore;
    offset += limit;

    console.log(`  Offset ${offset}: encontradas ${pending.length} pendentes (total até agora: ${allPayments.length})`);
  }

  return allPayments;
}

async function cancelPayment(paymentId: string): Promise<boolean> {
  try {
    await callAsaasApi<Payment>('DELETE', `/payments/${paymentId}`);
    return true;
  } catch (error) {
    console.error(`  Erro ao cancelar ${paymentId}:`, error);
    return false;
  }
}

async function main() {
  // Customer ID do usuário de teste (obtido do log do teste)
  const customerId = process.argv[2] || 'cus_000007485717';

  console.log('='.repeat(60));
  console.log('LIMPEZA DE COBRANÇAS PENDENTES - ASAAS SANDBOX');
  console.log('='.repeat(60));
  console.log(`Customer ID: ${customerId}`);

  // 1. Buscar todas as cobranças pendentes
  const pendingPayments = await getAllPendingPayments(customerId);

  console.log(`\nTotal de cobranças pendentes encontradas: ${pendingPayments.length}`);

  if (pendingPayments.length === 0) {
    console.log('\n✅ Nenhuma cobrança pendente para limpar!');
    return;
  }

  // 2. Listar o que será cancelado
  console.log('\nCobranças que serão canceladas:');
  for (const payment of pendingPayments) {
    console.log(`  - ${payment.id} | R$ ${payment.value} | Venc: ${payment.dueDate} | ${payment.description || 'Sem descrição'}`);
  }

  // 3. Cancelar cada uma
  console.log('\nCancelando cobranças...');
  let canceled = 0;
  let failed = 0;

  for (const payment of pendingPayments) {
    process.stdout.write(`  Cancelando ${payment.id}... `);
    const success = await cancelPayment(payment.id);
    if (success) {
      console.log('✅');
      canceled++;
    } else {
      console.log('❌');
      failed++;
    }
  }

  // 4. Resumo
  console.log('\n' + '='.repeat(60));
  console.log('RESUMO');
  console.log('='.repeat(60));
  console.log(`Total processadas: ${pendingPayments.length}`);
  console.log(`Canceladas com sucesso: ${canceled}`);
  console.log(`Falhas: ${failed}`);

  if (failed === 0) {
    console.log('\n✅ Limpeza concluída com sucesso!');
  } else {
    console.log('\n⚠️ Algumas cobranças não puderam ser canceladas.');
  }
}

main().catch(console.error);
