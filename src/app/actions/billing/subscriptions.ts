'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { AsaasService } from '@/lib/clients/asaas'
import { getCurrentUser } from '../user'
import { revalidatePath } from 'next/cache'
import type { UserSubscription, PlanGroup, CreateSubscriptionResult } from './types'
import { calculateUpgradeCredit, isUpgrade, PLAN_HIERARCHY } from './utils'

// =====================================================
// 1. createSubscription() - Criar Assinatura
// =====================================================

/**
 * Cria uma nova assinatura no Asaas.
 * 
 * Fluxo:
 * 1. Limpa subscription antiga (se existir)
 * 2. Calcula upgrade credit (se aplicável)
 * 3. Cria no Asaas com ROLLBACK em caso de falha
 * 4. Salva no banco SEM current_period_end (webhook seta)
 */
export async function createSubscription(planId: string): Promise<CreateSubscriptionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // 1. Buscar o plano selecionado
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (planError || !plan) throw new Error('Plano não encontrado')

  try {
    // 2. Verificar perfil com documento
    const currentUser = await getCurrentUser()
    if (!currentUser?.profile?.document || !currentUser?.profile?.full_name) {
      return { 
        success: false, 
        error: 'NEEDS_DOCUMENT',
        message: 'Para assinar um plano, você precisa completar seu cadastro com Nome e CPF/CNPJ.' 
      }
    }

    const profile = currentUser.profile

    // 3. Buscar subscription atual
    const { data: currentSub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // 4. Resolver cliente Asaas
    let asaasCustomerId = await resolveAsaasCustomer(
      currentSub?.asaas_customer_id,
      {
        name: profile.full_name || '',
        email: user.email || '',
        cpfCnpj: profile.document || '',
        externalReference: user.id
      }
    )

    // 5. LIMPAR subscription antiga (se existir)
    if (currentSub?.asaas_subscription_id) {
      try {
        await AsaasService.cancelSubscription(currentSub.asaas_subscription_id)
      } catch (error) {
        // Erro? Verificar se está paga
        const asaasSub = await AsaasService.getSubscription(currentSub.asaas_subscription_id)
        const payments = await AsaasService.getSubscriptionPayments(asaasSub.id)
        const isPaid = payments.data.some(p => 
          p.status === 'CONFIRMED' || p.status === 'RECEIVED'
        )
        
        if (isPaid) {
          // Já pago! Ativar e retornar erro
          await activatePlan(user.id, currentSub.asaas_subscription_id)
          return {
            success: false,
            error: 'ALREADY_PAID',
            message: 'Você já possui um plano ativo pago.'
          }
        }
        
        // Não pago: força limpeza local
        await supabase
          .from('user_subscriptions')
          .update({ asaas_subscription_id: null })
          .eq('user_id', user.id)
      }
    }

    // 6. Calcular upgrade credit (se aplicável)
    let discount: { value: number; dueDateLimitDays: number; type: 'FIXED' } | undefined
    
    if (currentSub?.current_period_end) {
      const newPlanGroup = plan.plan_group as PlanGroup
      if (isUpgrade(currentSub.plan_group, newPlanGroup)) {
        const credit = calculateUpgradeCredit(currentSub as UserSubscription, newPlanGroup)
        if (credit > 0) {
          discount = { value: credit, dueDateLimitDays: 0, type: 'FIXED' }
        }
      }
    }

    // 7. CRIAR no Asaas (com ROLLBACK)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    let asaasSub
    try {
      asaasSub = await AsaasService.createSubscription({
        customer: asaasCustomerId!,
        billingType: 'UNDEFINED',
        value: plan.price,
        nextDueDate: tomorrow.toISOString().split('T')[0],
        cycle: plan.interval === 'month' ? 'MONTHLY' : 'YEARLY',
        description: `Assinatura Plano ${plan.name} - uComis`,
        externalReference: user.id,
        discount
      })

      // 8. Salvar no banco SEM current_period_end
      const { error: subError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          plan_group: plan.plan_group,
          is_annual: plan.interval === 'year',
          trial_start_date: currentSub?.trial_start_date || new Date().toISOString(),
          trial_period_days: currentSub?.trial_period_days || 14,
          subscription_started_at: currentSub?.subscription_started_at || new Date().toISOString(),
          asaas_customer_id: asaasCustomerId,
          asaas_subscription_id: asaasSub.id,
          current_period_end: null, // ⚠️ NÃO setado ainda - webhook seta
          last_verified_at: new Date().toISOString(),
        })

      if (subError) throw subError

    } catch (dbError) {
      // ⚠️ ROLLBACK: Falhou ao salvar? Cancela no Asaas
      if (asaasSub?.id) {
        console.error('[Rollback] Falha ao salvar no banco, cancelando Asaas')
        try {
          await AsaasService.cancelSubscription(asaasSub.id)
        } catch (rollbackError) {
          console.error('[Rollback] Erro ao cancelar:', rollbackError)
        }
      }
      throw new Error('Falha ao processar assinatura. Tente novamente.')
    }

    // 9. Buscar link de pagamento
    let invoiceUrl = asaasSub.invoiceUrl || asaasSub.lastInvoiceUrl
    let invoiceId: string | undefined

    if (!invoiceUrl) {
      const payments = await AsaasService.getSubscriptionPayments(asaasSub.id)
      const pendingPayment = payments.data.find(p => p.status === 'PENDING') || payments.data[0]
      invoiceUrl = pendingPayment?.invoiceUrl
      invoiceId = pendingPayment?.id
    }

    if (!invoiceUrl) {
      throw new Error('Assinatura criada, mas sem link de pagamento.')
    }

    revalidatePath('/')

    return { 
      success: true, 
      subscriptionId: asaasSub.id,
      invoiceUrl,
      invoiceId
    }

  } catch (error: unknown) {
    console.error('Erro ao criar assinatura:', error)
    const message = error instanceof Error ? error.message : 'Falha ao processar assinatura no Asaas'
    
    if (message.includes('CPF') || message.includes('CNPJ') || message.includes('document')) {
      return { success: false, error: 'NEEDS_DOCUMENT', message: 'Documento obrigatório para faturamento.' }
    }

    return { success: false, error: 'API_ERROR', message }
  }
}

// =====================================================
// 2. activatePlan() - Ativar Plano
// =====================================================

/**
 * Ativa o plano do usuário após pagamento confirmado.
 * 
 * Chamado por:
 * - 99% → Webhook (PAYMENT_CONFIRMED)
 * - 1% → createSubscription (quando detecta já pago)
 */
export async function activatePlan(
  userId: string, 
  subscriptionId: string
): Promise<void> {
  const supabase = await createAdminClient()
  
  try {
    // 1. Buscar subscription do Asaas
    const asaasSub = await AsaasService.getSubscription(subscriptionId)
    
    // 2. Buscar último pagamento confirmado
    const payments = await AsaasService.getSubscriptionPayments(subscriptionId)
    const lastPaid = payments.data
      .filter(p => p.status === 'CONFIRMED' || p.status === 'RECEIVED')
      .sort((a, b) => {
        const dateA = a.paymentDate || a.dueDate
        const dateB = b.paymentDate || b.dueDate
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })[0]
    
    if (!lastPaid) {
      console.warn('[activatePlan] Nenhum pagamento confirmado encontrado')
      return
    }
    
    // 3. Calcular período
    const paymentDate = lastPaid.paymentDate || lastPaid.dueDate
    const periodStart = new Date(paymentDate)
    const periodEnd = new Date(paymentDate)
    
    if (asaasSub.cycle === 'MONTHLY') {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    }
    
    // 4. Atualizar banco (ATIVAR PLANO)
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        last_payment_date: paymentDate,
        next_billing_date: periodEnd.toISOString(),
        last_verified_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
    
    if (error) {
      console.error('[activatePlan] Erro ao atualizar banco:', error)
      throw error
    }
    
    console.log(`[activatePlan] ✅ Plano ativado: user=${userId}, period_end=${periodEnd.toISOString()}`)
    
  } catch (error) {
    console.error('[activatePlan] ❌ Erro:', error)
    throw error
  }
}

// =====================================================
// 3. verifySubscriptionStatus() - Verificar Status
// =====================================================

/**
 * Verifica o status da assinatura com o Asaas (fonte da verdade).
 * 
 * Chamado por: getEffectiveSubscription() quando cache expirou.
 */
export async function verifySubscriptionStatus(
  userId: string, 
  currentSub: UserSubscription
): Promise<void> {
  const supabase = await createAdminClient()
  
  try {
    // Não tem subscription? Apenas atualiza timestamp
    if (!currentSub.asaas_subscription_id) {
      await supabase
        .from('user_subscriptions')
        .update({ last_verified_at: new Date().toISOString() })
        .eq('user_id', userId)
      return
    }
    
    // Buscar do Asaas (fonte da verdade)
    const asaasSub = await AsaasService.getSubscription(currentSub.asaas_subscription_id)
    const payments = await AsaasService.getSubscriptionPayments(asaasSub.id)
    
    // Verificar se tem pagamento confirmado
    const hasPaid = payments.data.some(p => 
      p.status === 'CONFIRMED' || p.status === 'RECEIVED'
    )
    
    if (hasPaid) {
      // Pago! Ativar plano
      console.log('[Verificação] ✅ Pagamento encontrado, ativando plano')
      await activatePlan(userId, asaasSub.id)
    } else {
      // Não pago: atualiza timestamp apenas
      console.log('[Verificação] ⚠️ Ainda pendente')
      await supabase
        .from('user_subscriptions')
        .update({ last_verified_at: new Date().toISOString() })
        .eq('user_id', userId)
    }
    
  } catch (error) {
    console.error('[Verificação] ❌ Erro:', error)
    // Atualiza timestamp mesmo com erro (evita ficar tentando)
    await supabase
      .from('user_subscriptions')
      .update({ last_verified_at: new Date().toISOString() })
      .eq('user_id', userId)
  }
}

// =====================================================
// HELPERS PRIVADOS
// =====================================================

/**
 * Resolve ou cria cliente no Asaas.
 */
async function resolveAsaasCustomer(
  existingCustomerId: string | null | undefined,
  customerData: {
    name: string
    email: string
    cpfCnpj: string
    externalReference: string
  }
): Promise<string> {
  // 1. Tentar usar ID existente
  if (existingCustomerId) {
    const existingCustomer = await AsaasService.getCustomer(existingCustomerId)
    if (existingCustomer && !existingCustomer.deleted) {
      try {
        await AsaasService.updateCustomer(existingCustomerId, customerData)
      } catch (err) {
        console.warn('Erro ao atualizar cliente no Asaas:', err)
      }
      return existingCustomerId
    }
  }

  // 2. Buscar por CPF/CNPJ
  if (customerData.cpfCnpj) {
    const customerByCpf = await AsaasService.findCustomerByCpfCnpj(customerData.cpfCnpj)
    if (customerByCpf && !customerByCpf.deleted) {
      return customerByCpf.id
    }
  }

  // 3. Buscar por email
  if (customerData.email) {
    const customerByEmail = await AsaasService.findCustomerByEmail(customerData.email)
    if (customerByEmail && !customerByEmail.deleted) {
      return customerByEmail.id
    }
  }

  // 4. Criar novo
  const newCustomer = await AsaasService.createCustomer(customerData)
  return newCustomer.id
}
