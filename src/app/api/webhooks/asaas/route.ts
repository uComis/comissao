import { createAdminClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { activatePlan } from '@/app/actions/billing'

const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const authToken = req.headers.get('asaas-access-token')

    // 1. Validar token de segurança (se configurado)
    if (ASAAS_WEBHOOK_TOKEN && authToken !== ASAAS_WEBHOOK_TOKEN) {
      console.error('Webhook Asaas: Token inválido')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { event, payment, subscription } = body
    console.log(`[Webhook] Evento recebido: ${event}`)

    const supabase = createAdminClient()

    // ⚠️ IDEMPOTÊNCIA: Verificar se já processamos este evento
    const eventId = `${payment?.id || subscription?.id}_${event}`
    
    const { data: existing } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .single()
    
    if (existing) {
      console.log('[Webhook] Evento duplicado, ignorando:', eventId)
      return NextResponse.json({ received: true, duplicate: true })
    }
    
    // Registrar evento
    await supabase.from('webhook_events').insert({
      event_id: eventId,
      event_type: event,
      payload: body
    })

    // 2. PAGAMENTO CONFIRMADO
    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      const subId = payment?.subscription
      
      if (subId) {
        // Buscar usuário pela subscription
        const { data: userSub } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('asaas_subscription_id', subId)
          .single()
        
        if (userSub) {
          await activatePlan(userSub.user_id, subId)
          console.log(`[Webhook] ✅ Plano ativado: ${subId}`)
        } else {
          console.warn(`[Webhook] ⚠️ Subscription não encontrada: ${subId}`)
        }
      }
    }

    // 3. SUBSCRIPTION CANCELADA
    if (event === 'SUBSCRIPTION_DELETED') {
      const subId = subscription?.id
      
      if (subId) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            asaas_subscription_id: null,
            current_period_end: null,
            last_verified_at: new Date().toISOString(),
          })
          .eq('asaas_subscription_id', subId)
        
        if (error) {
          console.error('[Webhook] Erro ao limpar subscription:', error)
        } else {
          console.log(`[Webhook] ⚠️ Subscription cancelada: ${subId}`)
        }
      }
    }

    // 4. PAGAMENTO VENCIDO (informativo, não altera plano)
    if (event === 'PAYMENT_OVERDUE') {
      const subId = payment?.subscription
      console.log(`[Webhook] ⏰ Pagamento vencido: ${subId}`)
      // Não fazemos nada aqui - o cache inteligente detecta inadimplência
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Webhook] ❌ Erro no processamento:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
