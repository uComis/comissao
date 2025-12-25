import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const authToken = req.headers.get('asaas-access-token');

    // 1. Validar token de segurança (se configurado)
    if (ASAAS_WEBHOOK_TOKEN && authToken !== ASAAS_WEBHOOK_TOKEN) {
      console.error('Webhook Asaas: Token inválido');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, payment, subscription } = body;
    console.log(`Webhook Asaas recebido: ${event}`, body);

    const supabase = await createClient();

    // 2. Processar eventos de pagamento
    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      const asaasSubscriptionId = payment?.subscription;

      if (asaasSubscriptionId) {
        // Ativar a assinatura no banco
        const { error } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('asaas_subscription_id', asaasSubscriptionId);

        if (error) {
          console.error('Erro ao atualizar assinatura no webhook:', error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
      }
    }

    // 3. Processar cancelamentos
    if (event === 'SUBSCRIPTION_DELETED') {
      const asaasSubscriptionId = subscription?.id;

      if (asaasSubscriptionId) {
        const { error } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('asaas_subscription_id', asaasSubscriptionId);

        if (error) {
          console.error('Erro ao cancelar assinatura no webhook:', error);
        }
      }
    }

    // 4. Processar inadimplência
    if (event === 'PAYMENT_OVERDUE') {
       const asaasSubscriptionId = payment?.subscription;

      if (asaasSubscriptionId) {
        const { error } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('asaas_subscription_id', asaasSubscriptionId);

        if (error) {
          console.error('Erro ao marcar inadimplência no webhook:', error);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro no processamento do Webhook Asaas:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

