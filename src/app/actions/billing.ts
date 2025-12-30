'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { AsaasService } from '@/lib/clients/asaas'
import { getProfile } from './profiles'
import { revalidatePath } from 'next/cache'

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
  notified_plan_id?: string | null
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
 * Se o usuário não tiver assinatura/usage, cria automaticamente (defensive).
 */
export async function checkLimit(
  userId: string, 
  feature: 'sales' | 'suppliers' | 'users'
): Promise<{ allowed: boolean; error?: string }> {
  let subscription = await getSubscription(userId)
  let usage = await getUsageStats(userId)

  // Defensive: se usuário antigo não tem subscription/usage, criar automaticamente
  if (!subscription || !usage) {
    try {
      await setupTrialSubscription(userId)
      subscription = await getSubscription(userId)
      usage = await getUsageStats(userId)
    } catch (err) {
      console.error('Erro ao criar subscription automática:', err)
      return { allowed: false, error: 'Assinatura não encontrada. Por favor, entre em contato com o suporte.' }
    }
  }

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

export type CreateSubscriptionResult = 
  | { success: true; subscriptionId: string; invoiceUrl: string; invoiceId?: string }
  | { success: false; error: string; message: string }

/**
 * Inicia o processo de assinatura com o Asaas.
 */
export async function createSubscriptionAction(planId: string): Promise<CreateSubscriptionResult> {
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
      const existingCustomer = await AsaasService.getCustomer(existingSub.asaas_customer_id)
      if (existingCustomer && !existingCustomer.deleted) {
        asaasCustomerId = existingCustomer.id
      }
    }

    if (!asaasCustomerId) {
      const customerByCpf = await AsaasService.findCustomerByCpfCnpj(profile.document)
      if (customerByCpf && !customerByCpf.deleted) {
        asaasCustomerId = customerByCpf.id
      }
    }

    if (!asaasCustomerId && user.email) {
      const customerByEmail = await AsaasService.findCustomerByEmail(user.email)
      if (customerByEmail && !customerByEmail.deleted) {
        asaasCustomerId = customerByEmail.id
      }
    }

    if (asaasCustomerId) {
      try {
        await AsaasService.updateCustomer(asaasCustomerId, customerData)
      } catch (err) {
        console.warn('Erro ao atualizar dados do cliente no Asaas (não crítico):', err)
      }
    } else {
      const newCustomer = await AsaasService.createCustomer(customerData)
      asaasCustomerId = newCustomer.id
    }

    // --- LÓGICA DE REUSO (UX SENIOR) ---
    // 4. Verificar se já existe uma assinatura PENDING para este plano
    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_id', planId)
      .in('status', ['unpaid', 'past_due'])
      .maybeSingle()

    if (currentSub?.asaas_subscription_id) {
      // Busca as cobranças dessa assinatura para ver se tem uma PENDING
      const payments = await AsaasService.getSubscriptionPayments(currentSub.asaas_subscription_id)
      const pendingPayment = payments.data.find(p => p.status === 'PENDING')
      
      if (pendingPayment) {
        console.log('Reutilizando assinatura/fatura pendente existente...')
        return {
          success: true,
          subscriptionId: currentSub.asaas_subscription_id,
          invoiceUrl: pendingPayment.invoiceUrl,
          invoiceId: pendingPayment.id
        }
      }
    }

    // 5. Se não tem para reusar, limpa as "lixo" antes de criar nova
    const { data: previousSubs } = await supabase
      .from('subscriptions')
      .select('id, asaas_subscription_id')
      .eq('user_id', user.id)
      .in('status', ['unpaid', 'past_due'])

    if (previousSubs && previousSubs.length > 0) {
      for (const sub of previousSubs) {
        if (sub.asaas_subscription_id) {
          try {
            await AsaasService.cancelSubscription(sub.asaas_subscription_id)
          } catch (err) {
            console.error(`Erro ao cancelar lixo ${sub.asaas_subscription_id}:`, err)
          }
        }
      }
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('user_id', user.id)
        .in('status', ['unpaid', 'past_due'])
    }

    // 6. Criar nova assinatura no Asaas
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const asaasSub = await AsaasService.createSubscription({
      customer: asaasCustomerId!,
      billingType: 'UNDEFINED',
      value: plan.price,
      nextDueDate: tomorrow.toISOString().split('T')[0],
      cycle: plan.interval === 'month' ? 'MONTHLY' : 'ANNUALLY',
      description: `Assinatura Plano ${plan.name} - uComis`,
      externalReference: user.id
    })

    // 7. Buscar link de pagamento
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

    // 8. Salvar no banco
    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        status: 'unpaid',
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

    return { 
      success: true, 
      subscriptionId: asaasSub.id,
      invoiceUrl: invoiceUrl,
      invoiceId: invoiceId
    }
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

/**
 * Busca todas as cobranças do usuário no Asaas.
 */
export async function getInvoicesAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // 1. Buscar asaas_customer_id mais recente
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('asaas_customer_id')
    .eq('user_id', user.id)
    .not('asaas_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!subscription?.asaas_customer_id) return []

  try {
    // 2. Buscar TODAS as faturas do cliente para ter um histórico completo
    const payments = await AsaasService.getCustomerPayments(subscription.asaas_customer_id)
    
    // 3. Filtrar apenas o que não foi removido/deletado e ordenar por vencimento desc
    return payments.data
      .filter(p => !p.deleted)
      .map(p => ({
        id: p.id,
        status: p.status,
        value: p.value,
        dueDate: p.dueDate,
        invoiceUrl: p.invoiceUrl,
        description: p.description || 'Assinatura uComis'
      }))
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
  } catch (error) {
    console.error('Erro ao buscar faturas:', error)
    return []
  }
}

/**
 * Marca o plano atual como notificado para evitar parabéns duplicados.
 */
export async function markPlanAsNotifiedAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const subscription = await getSubscription(user.id)
  if (!subscription) return

  // Usamos admin client para garantir que o update de metadados ocorra sem travas de RLS
  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('subscriptions')
    .update({ notified_plan_id: subscription.plan_id })
    .eq('id', subscription.id)

  if (error) {
    console.error('Erro ao marcar plano como notificado:', error)
    throw new Error('Falha ao atualizar status de notificação')
  }

  revalidatePath('/')
}

