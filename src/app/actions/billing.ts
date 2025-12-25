'use server'

import { createClient } from '@/lib/supabase-server'
import { AsaasService } from '@/lib/clients/asaas'
import { getProfile } from './profiles'

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'

export interface PlanLimits {
  name?: string
  max_suppliers: number
  max_sales_month: number
  max_users: number
  max_revenue_month: number | null
  features: Record<string, unknown>
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: SubscriptionStatus
  plan_snapshot: PlanLimits
  trial_ends_at: string | null
  current_period_start: string
  current_period_end: string | null
  asaas_customer_id: string | null
  asaas_subscription_id: string | null
  cancel_at_period_end: boolean
}

export interface UsageStats {
  user_id: string
  sales_count_current_month: number
  suppliers_count: number
  users_count: number
  last_reset_date: string
}

/**
 * Busca todos os planos públicos.
 */
export async function getPlans() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_public', true)
    .order('price', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Action para o UsageWidget e UI de billing.
 */
export async function getBillingUsage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const subscription = await getSubscription(user.id)
  const usage = await getUsageStats(user.id)

  if (!subscription || !usage) return null

  return {
    plan: subscription.plan_snapshot.name || subscription.plan_id.split('_')[0].toUpperCase(),
    vendas: {
      current: usage.sales_count_current_month,
      limit: subscription.plan_snapshot.max_sales_month,
    },
    pastas: {
      current: usage.suppliers_count,
      limit: subscription.plan_snapshot.max_suppliers,
    },
    trialEndsAt: subscription.trial_ends_at,
    status: subscription.status,
  }
}

/**
 * Busca a assinatura ativa do usuário.
 * Se não houver, retorna null.
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['trialing', 'active', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return data as Subscription
}

/**
 * Busca as estatísticas de uso do usuário.
 */
export async function getUsageStats(userId: string): Promise<UsageStats | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('usage_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data as UsageStats
}

/**
 * Cria uma assinatura trial para um novo usuário.
 */
export async function setupTrialSubscription(userId: string) {
  const supabase = await createClient()

  // 1. Buscar o plano FREE para pegar os limites base
  const { data: freePlan, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', 'free_monthly')
    .single()

  if (planError) throw planError

  // 2. Criar a assinatura status trialing
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 14) // 7 dias de trial

  const { error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_id: 'free_monthly',
      status: 'trialing',
      plan_snapshot: {
        name: freePlan.name,
        max_suppliers: freePlan.max_suppliers,
        max_sales_month: freePlan.max_sales_month,
        max_users: freePlan.max_users,
        max_revenue_month: freePlan.max_revenue_month,
        features: freePlan.features
      },
      trial_ends_at: trialEndsAt.toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: trialEndsAt.toISOString(),
    })

  if (subError) throw subError

  // 3. Inicializar usage_stats
  const { error: usageError } = await supabase
    .from('usage_stats')
    .insert({
      user_id: userId,
      sales_count_current_month: 0,
      suppliers_count: 0,
    })

  if (usageError) throw usageError
}

/**
 * Helper para verificar limites antes de uma ação.
 */
export async function checkLimit(
  userId: string, 
  feature: 'sales' | 'suppliers' | 'users'
): Promise<{ allowed: boolean; error?: string }> {
  const subscription = await getSubscription(userId)
  const usage = await getUsageStats(userId)

  if (!subscription || !usage) {
    return { allowed: false, error: 'Assinatura não encontrada. Por favor, entre em contato com o suporte.' }
  }

  const limits = subscription.plan_snapshot

  switch (feature) {
    case 'sales':
      if (usage.sales_count_current_month >= limits.max_sales_month) {
        return { 
          allowed: false, 
          error: `Limite de vendas atingido (${limits.max_sales_month}/${limits.max_sales_month}). Faça um upgrade para continuar.` 
        }
      }
      break
    case 'suppliers':
      if (usage.suppliers_count >= limits.max_suppliers) {
        return { 
          allowed: false, 
          error: `Limite de fornecedores/pastas atingido (${limits.max_suppliers}/${limits.max_suppliers}). Faça um upgrade para continuar.` 
        }
      }
      break
    case 'users':
      if (usage.users_count >= limits.max_users) {
         return { 
          allowed: false, 
          error: `Limite de usuários atingido (${limits.max_users}/${limits.max_users}). Faça um upgrade para continuar.` 
        }
      }
      break
  }

  return { allowed: true }
}

/**
 * Incrementa o uso de uma feature.
 */
export async function incrementUsage(
  userId: string,
  feature: 'sales' | 'suppliers' | 'users'
) {
  const supabase = await createClient()
  
  if (feature === 'sales') {
    await supabase.rpc('increment_sales_usage', { user_id_param: userId })
  } else if (feature === 'suppliers') {
    await supabase.rpc('increment_suppliers_usage', { user_id_param: userId })
  } else {
    await supabase.rpc('increment_users_usage', { user_id_param: userId })
  }
}

/**
 * Decrementa o uso de uma feature (ex: excluir venda).
 */
export async function decrementUsage(
  userId: string,
  feature: 'sales' | 'suppliers' | 'users'
) {
  const supabase = await createClient()
  
  if (feature === 'sales') {
    await supabase.rpc('decrement_sales_usage', { user_id_param: userId })
  } else if (feature === 'suppliers') {
    await supabase.rpc('decrement_suppliers_usage', { user_id_param: userId })
  } else {
    await supabase.rpc('decrement_users_usage', { user_id_param: userId })
  }
}

/**
 * Inicia o processo de assinatura com o Asaas.
 */
export async function createSubscriptionAction(planId: string) {
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
    // 2. Verificar se o usuário tem perfil com documento
    const profile = await getProfile()
    if (!profile?.document || !profile?.full_name) {
      return { 
        success: false, 
        error: 'NEEDS_DOCUMENT',
        message: 'Para assinar um plano, você precisa completar seu cadastro com Nome e CPF/CNPJ.' 
      }
    }

    // 3. Buscar ou resolver cliente no Asaas (Fluxo Robusto)
    let asaasCustomerId: string | null = null
    const customerData = {
      name: profile.full_name,
      email: user.email || '',
      cpfCnpj: profile.document,
      externalReference: user.id
    }
    
    // 3.1 Tentar pelo ID salvo no banco
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('asaas_customer_id')
      .eq('user_id', user.id)
      .not('asaas_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingSub?.asaas_customer_id) {
      // Verifica se o cliente ainda existe e é válido no Asaas
      const existingCustomer = await AsaasService.getCustomer(existingSub.asaas_customer_id)
      if (existingCustomer && !existingCustomer.deleted) {
        asaasCustomerId = existingCustomer.id
      }
    }

    // 3.2 Se não achou pelo ID válido, tenta pelo CPF/CNPJ
    if (!asaasCustomerId) {
      const customerByCpf = await AsaasService.findCustomerByCpfCnpj(profile.document)
      if (customerByCpf && !customerByCpf.deleted) {
        asaasCustomerId = customerByCpf.id
      }
    }

    // 3.3 Se não achou pelo CPF, tenta pelo Email
    if (!asaasCustomerId && user.email) {
      const customerByEmail = await AsaasService.findCustomerByEmail(user.email)
      if (customerByEmail && !customerByEmail.deleted) {
        asaasCustomerId = customerByEmail.id
      }
    }

    // 3.4 Se achou alguém, atualiza os dados para garantir consistência
    if (asaasCustomerId) {
      try {
        await AsaasService.updateCustomer(asaasCustomerId, customerData)
      } catch (err) {
        console.warn('Erro ao atualizar dados do cliente no Asaas (não crítico):', err)
      }
    } else {
      // 3.5 Se não achou ninguém, cria novo
      const newCustomer = await AsaasService.createCustomer(customerData)
      asaasCustomerId = newCustomer.id
    }

    // 4. Criar assinatura no Asaas
    // Vamos usar a primeira parcela para amanhã para dar tempo do checkout
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const asaasSub = await AsaasService.createSubscription({
      customer: asaasCustomerId!,
      billingType: 'UNDEFINED', // Permite que o usuário escolha (Cartão, Boleto ou PIX) no checkout do Asaas
      value: plan.price,
      nextDueDate: tomorrow.toISOString().split('T')[0],
      cycle: plan.interval === 'month' ? 'MONTHLY' : 'ANNUALLY',
      description: `Assinatura Plano ${plan.name} - Comissao.io`,
      externalReference: user.id
    }) as { id: string; invoiceUrl?: string; lastInvoiceUrl?: string }

    // 5. Buscar a fatura gerada para obter o link de pagamento
    // Como a assinatura foi criada com billingType UNDEFINED, precisamos pegar o link da cobrança gerada
    let invoiceUrl = asaasSub.invoiceUrl || asaasSub.lastInvoiceUrl

    if (!invoiceUrl) {
      try {
        const payments = await AsaasService.getSubscriptionPayments(asaasSub.id)
        if (payments.data && payments.data.length > 0) {
          // Pega a primeira fatura pendente
          const pendingPayment = payments.data.find(p => p.status === 'PENDING') || payments.data[0]
          invoiceUrl = pendingPayment.invoiceUrl
        }
      } catch (err) {
        console.error('Erro ao buscar fatura da assinatura:', err)
      }
    }

    if (!invoiceUrl) {
      throw new Error('Assinatura criada, mas não foi possível gerar o link de pagamento.')
    }

    // 6. Limpeza de assinaturas anteriores (Opção C - Substituição Automática)
    // Busca qualquer assinatura anterior que não esteja cancelada (unpaid, trialing, active, past_due)
    const { data: previousSubs } = await supabase
      .from('subscriptions')
      .select('id, asaas_subscription_id')
      .eq('user_id', user.id)
      .in('status', ['unpaid', 'trialing', 'active', 'past_due'])

    if (previousSubs && previousSubs.length > 0) {
      console.log(`Cancelando ${previousSubs.length} assinaturas anteriores para limpar o fluxo...`)
      
      for (const sub of previousSubs) {
        // 1. Cancelar no Asaas se tiver ID vinculado
        if (sub.asaas_subscription_id) {
          try {
            await AsaasService.cancelSubscription(sub.asaas_subscription_id)
          } catch (err) {
            console.error(`Erro ao cancelar assinatura antiga ${sub.asaas_subscription_id} no Asaas:`, err)
            // Não travamos o fluxo, apenas logamos
          }
        }
      }

      // 2. Marcar todas como canceladas no banco de uma vez
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('user_id', user.id)
        .in('status', ['unpaid', 'trialing', 'active', 'past_due'])
    }
    
    // 7. Salvar a nova assinatura no banco
    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        status: 'unpaid', // Fica unpaid até o webhook confirmar o pagamento
        asaas_customer_id: asaasCustomerId,
        asaas_subscription_id: asaasSub.id,
        plan_snapshot: {
          name: plan.name,
          max_suppliers: plan.max_suppliers,
          max_sales_month: plan.max_sales_month,
          max_users: plan.max_users,
          max_revenue_month: plan.max_revenue_month,
          features: plan.features
        },
        current_period_start: new Date().toISOString(),
      })

    if (subError) throw subError

    const retorno = { 
      success: true, 
      subscriptionId: asaasSub.id,
      invoiceUrl: invoiceUrl // URL garantida agora
    }

    return retorno;
  } catch (error: unknown) {
    console.error('Erro ao criar assinatura:', error)
    const message = error instanceof Error ? error.message : 'Falha ao processar assinatura no Asaas'
    
    // Se o Asaas reclamar de falta de documento, tratamos como NEEDS_DOCUMENT
    if (message.includes('CPF') || message.includes('CNPJ') || message.includes('document')) {
      return { 
        success: false, 
        error: 'NEEDS_DOCUMENT', 
        message: 'Documento obrigatório para faturamento.' 
      }
    }

    return { success: false, error: 'API_ERROR', message }
  }
}

