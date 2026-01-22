'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { AsaasService } from '@/lib/clients/asaas'
import { getCurrentUser, type CurrentUser } from './user'
import { revalidatePath } from 'next/cache'

// =====================================================
// TYPES - Nova estrutura baseada em user_subscriptions
// =====================================================

export type PlanGroup = 'free' | 'pro' | 'ultra'

export interface UserSubscription {
  user_id: string
  plan_group: PlanGroup
  is_annual: boolean
  trial_start_date: string
  trial_period_days: number
  subscription_started_at: string | null
  last_payment_date: string | null
  current_period_start: string | null
  current_period_end: string | null
  next_billing_date: string | null
  asaas_customer_id: string | null
  asaas_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface TrialInfo {
  isActive: boolean
  daysRemaining: number
  endsAt: string | null
}

export interface RenewalAlert {
  needsAlert: boolean
  daysRemaining: number | null
  urgencyLevel: 'urgent' | 'warning' | null
}

export interface EffectiveSubscription {
  // Dados brutos
  subscription: UserSubscription
  
  // Estados computados (a "verdade")
  effectivePlanGroup: PlanGroup
  isInTrial: boolean
  isPaidUp: boolean
  
  // Informações úteis
  trial: TrialInfo
  renewalAlert: RenewalAlert | null
  
  // Limites do plano efetivo
  limits: PlanLimits
}

export interface PlanLimits {
  plan_group: PlanGroup
  max_suppliers: number
  max_sales_month: number
  max_users: number
  features: Record<string, unknown>
}

export interface UsageStats {
  user_id: string
  sales_count_current_month: number
  suppliers_count: number
  users_count: number
  last_reset_date: string
}

// =====================================================
// FUNÇÕES PRINCIPAIS
// =====================================================

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
 * Retorna a assinatura efetiva do usuário com todos os estados calculados.
 * Esta é a FONTE ÚNICA DA VERDADE para qualquer verificação de plano/trial.
 * 
 * Durante trial: retorna 'ultra' como plano efetivo
 * Após trial pago: retorna o plano que o usuário pagou
 * Após trial inadimplente: retorna 'free'
 */
export async function getEffectiveSubscription(userId: string): Promise<EffectiveSubscription | null> {
  const supabase = await createClient()
  
  // 1. Buscar user_subscription
  const { data: sub, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !sub) return null

  const subscription = sub as UserSubscription
  const now = new Date()
  
  // 2. Calcular data de fim do trial (verificar se tem trial válido)
  let isInTrial = false
  let trialEnd = new Date()
  
  if (subscription.trial_start_date && subscription.trial_period_days) {
    trialEnd = new Date(subscription.trial_start_date)
    trialEnd.setDate(trialEnd.getDate() + subscription.trial_period_days)
    isInTrial = now < trialEnd
  }
  
  // 3. Calcular isPaidUp
  const isPaidUp = subscription.current_period_end 
    ? now <= new Date(subscription.current_period_end) 
    : false
  
  // 4. Determinar plano efetivo
  let effectivePlanGroup: PlanGroup = 'free'
  if (isInTrial) {
    effectivePlanGroup = 'ultra' // Durante trial = sempre Ultra
  } else if (isPaidUp) {
    effectivePlanGroup = subscription.plan_group // Pago = plano contratado
  } else {
    effectivePlanGroup = 'free' // Inadimplente = free
  }
  
  // 5. Calcular info de trial
  const daysRemaining = isInTrial 
    ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0
  
  const trial: TrialInfo = {
    isActive: isInTrial,
    daysRemaining,
    endsAt: trialEnd.toISOString()
  }
  
  // 6. Calcular alerta de renovação (se aplicável)
  let renewalAlert: RenewalAlert | null = null
  if (subscription.plan_group !== 'free' && subscription.current_period_end) {
    const daysUntilRenewal = Math.ceil(
      (new Date(subscription.current_period_end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysUntilRenewal <= 1) {
      renewalAlert = { needsAlert: true, daysRemaining: daysUntilRenewal, urgencyLevel: 'urgent' }
    } else if (daysUntilRenewal <= 3) {
      renewalAlert = { needsAlert: true, daysRemaining: daysUntilRenewal, urgencyLevel: 'warning' }
    } else {
      renewalAlert = { needsAlert: false, daysRemaining: daysUntilRenewal, urgencyLevel: null }
    }
  }
  
  // 7. Buscar limites do plano efetivo
  const { data: planLimits } = await supabase
    .from('plans')
    .select('plan_group, max_suppliers, max_sales_month, max_users, features')
    .eq('plan_group', effectivePlanGroup)
    .limit(1)
    .single()
  
  const limits: PlanLimits = planLimits || {
    plan_group: 'free',
    max_suppliers: 1,
    max_sales_month: 30,
    max_users: 1,
    features: {}
  }
  
  return {
    subscription,
    effectivePlanGroup,
    isInTrial,
    isPaidUp,
    trial,
    renewalAlert,
    limits
  }
}

/**
 * Cria uma assinatura trial para um novo usuário.
 * Todo novo usuário começa com 14 dias de trial Ultra.
 * 
 * Usa UPSERT para evitar duplicatas caso seja chamado múltiplas vezes.
 */
export async function setupTrialSubscription(userId: string) {
  const supabase = await createClient()

  // 1. Buscar o plano ULTRA para pegar trial_days
  const { data: ultraPlan } = await supabase
    .from('plans')
    .select('trial_days')
    .eq('id', 'ultra_monthly')
    .single()

  const trialDays = ultraPlan?.trial_days || 14

  // 2. Criar/atualizar registro em user_subscriptions (UPSERT)
  // Se já existe, não sobrescreve dados importantes (trial_start_date, asaas_ids, etc)
  const { data: existingSub } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('user_id', userId)
    .single()

  if (!existingSub) {
    // Só insere se não existir
    const { error: subError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_group: 'free', // Começa como free, mas com trial ultra ativo
        is_annual: false,
        trial_start_date: new Date().toISOString(),
        trial_period_days: trialDays,
      })

    if (subError) throw subError
  }

  // 3. Inicializar usage_stats (UPSERT para evitar erro)
  const { error: usageError } = await supabase
    .from('usage_stats')
    .upsert({
      user_id: userId,
      sales_count_current_month: 0,
      suppliers_count: 0,
      users_count: 0,
    }, { onConflict: 'user_id' })

  if (usageError) throw usageError
}

/**
 * Helper: Transforma getCurrentUser() no formato antigo de getBillingUsage()
 * Mantido temporariamente para compatibilidade durante migração
 * @deprecated Use getCurrentUser() diretamente
 */
export async function getBillingUsage() {
  const currentUser = await getCurrentUser()
  if (!currentUser?.billing || !currentUser?.usage) return null

  const { billing, usage } = currentUser
  const shouldShowTrialAlert = billing.isInTrial && !billing.asaasSubscriptionId

  return {
    plan: billing.effectivePlan.toUpperCase(),
    contractedPlan: billing.planGroup,
    vendas: {
      current: usage.sales_count_current_month,
      limit: billing.limits.max_sales_month,
    },
    pastas: {
      current: usage.suppliers_count,
      limit: billing.limits.max_suppliers,
    },
    trial: {
      ...billing.trial,
      shouldShowAlert: shouldShowTrialAlert,
    },
    renewalAlert: billing.renewalAlert,
    isInTrial: billing.isInTrial,
    isPaidUp: billing.isPaidUp,
  }
}

/**
 * Retorna a data mínima permitida para consulta de vendas baseada no plano do usuário.
 * - null = sem restrição (ilimitado)
 * - Date = limitar às vendas após esta data
 */
export async function getDataRetentionFilter(userId: string): Promise<Date | null> {
  const effectiveSub = await getEffectiveSubscription(userId)
  if (!effectiveSub) return null

  const retentionDays = effectiveSub.limits.features?.data_retention_days
  
  // null ou undefined = ilimitado
  if (retentionDays === null || retentionDays === undefined) {
    return null
  }

  // > 0 = aplicar filtro
  if (typeof retentionDays === 'number' && retentionDays > 0) {
    const minDate = new Date()
    minDate.setDate(minDate.getDate() - retentionDays)
    return minDate
  }

  return null
}

/**
 * Verifica quais pastas (fornecedores) estão bloqueadas pelo limite do plano.
 */
export async function getBlockedSuppliers(userId?: string): Promise<{
  allowedCount: number
  blockedCount: number
  blockedSupplierIds: string[]
}> {
  const supabase = await createClient()
  
  let effectiveUserId = userId
  if (!effectiveUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { allowedCount: 0, blockedCount: 0, blockedSupplierIds: [] }
    }
    effectiveUserId = user.id
  }
  
  const effectiveSub = await getEffectiveSubscription(effectiveUserId)
  
  if (!effectiveSub) {
    return { allowedCount: 0, blockedCount: 0, blockedSupplierIds: [] }
  }

  const maxSuppliers = effectiveSub.limits.max_suppliers || 1

  const { data: suppliers, error } = await supabase
    .from('personal_suppliers')
    .select('id, created_at')
    .eq('user_id', effectiveUserId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error || !suppliers) {
    return { allowedCount: 0, blockedCount: 0, blockedSupplierIds: [] }
  }

  const totalSuppliers = suppliers.length
  const allowedCount = Math.min(totalSuppliers, maxSuppliers)
  const blockedCount = Math.max(0, totalSuppliers - maxSuppliers)
  
  const blockedSupplierIds = suppliers
    .slice(maxSuppliers)
    .map(s => s.id)

  return {
    allowedCount,
    blockedCount,
    blockedSupplierIds
  }
}

/**
 * Helper interno para buscar usage_stats (usado apenas internamente em billing.ts)
 */
async function _getUsageStatsInternal(userId: string): Promise<UsageStats | null> {
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
 * Helper para verificar limites antes de uma ação.
 * Se o usuário não tiver assinatura/usage, cria automaticamente (defensive).
 */
export async function checkLimit(
  userId: string, 
  feature: 'sales' | 'suppliers' | 'users'
): Promise<{ allowed: boolean; error?: string }> {
  let effectiveSub = await getEffectiveSubscription(userId)
  let usage = await _getUsageStatsInternal(userId)

  // Defensive: se usuário antigo não tem subscription/usage, criar automaticamente
  if (!effectiveSub || !usage) {
    try {
      await setupTrialSubscription(userId)
      effectiveSub = await getEffectiveSubscription(userId)
      usage = await _getUsageStatsInternal(userId)
    } catch (err) {
      console.error('Erro ao criar subscription automática:', err)
      return { allowed: false, error: 'Assinatura não encontrada. Por favor, entre em contato com o suporte.' }
    }
  }

  if (!effectiveSub || !usage) {
    return { allowed: false, error: 'Assinatura não encontrada. Por favor, entre em contato com o suporte.' }
  }

  const limits = effectiveSub.limits

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

// =====================================================
// ASSINATURA E PAGAMENTO
// =====================================================

export type CreateSubscriptionResult = 
  | { success: true; subscriptionId: string; invoiceUrl: string; invoiceId?: string }
  | { success: false; error: string; message: string }

/**
 * Inicia o processo de assinatura com o Asaas.
 * Lógica CRÍTICA: Preserva trial_start_date e trial_period_days para manter Ultra até fim do trial.
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
    const currentUser = await getCurrentUser()
    if (!currentUser?.profile?.document || !currentUser?.profile?.full_name) {
      return { 
        success: false, 
        error: 'NEEDS_DOCUMENT',
        message: 'Para assinar um plano, você precisa completar seu cadastro com Nome e CPF/CNPJ.' 
      }
    }

    const profile = currentUser.profile

    // 3. Buscar subscription atual para preservar dados de trial
    const { data: currentSub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // 4. Buscar ou resolver cliente no Asaas
    let asaasCustomerId: string | null = currentSub?.asaas_customer_id || null
    const customerData = {
      name: profile.full_name || '',
      email: user.email || '',
      cpfCnpj: profile.document || '',
      externalReference: user.id
    }
    
    if (asaasCustomerId) {
      const existingCustomer = await AsaasService.getCustomer(asaasCustomerId)
      if (!existingCustomer || existingCustomer.deleted) {
        asaasCustomerId = null
      } else {
        try {
          await AsaasService.updateCustomer(asaasCustomerId, customerData)
        } catch (err) {
          console.warn('Erro ao atualizar cliente no Asaas:', err)
        }
      }
    }

    if (!asaasCustomerId && profile.document) {
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

    // 5. Cancelar assinatura antiga no Asaas se existir
    if (currentSub?.asaas_subscription_id) {
      try {
        await AsaasService.cancelSubscription(currentSub.asaas_subscription_id)
      } catch (err) {
        console.warn('Erro ao cancelar assinatura antiga no Asaas:', err)
      }
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

    // 8. Calcular período de pagamento
    const periodStart = new Date()
    const periodEnd = new Date()
    if (plan.interval === 'month') {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    }

    // 9. UPDATE (não INSERT!) em user_subscriptions
    // CRÍTICO: Preservar trial_start_date e trial_period_days para manter Ultra até fim do trial
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
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        next_billing_date: periodEnd.toISOString(),
      })

    if (subError) throw subError

    revalidatePath('/')

    return { 
      success: true, 
      subscriptionId: asaasSub.id,
      invoiceUrl: invoiceUrl,
      invoiceId: invoiceId
    }
  } catch (error: unknown) {
    console.error('Erro ao criar assinatura:', error)
    const message = error instanceof Error ? error.message : 'Falha ao processar assinatura no Asaas'
    
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

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('asaas_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!subscription?.asaas_customer_id) return []

  try {
    const payments = await AsaasService.getCustomerPayments(subscription.asaas_customer_id)
    
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
 * Faz a transição de trials expirados para o plano correto.
 * - Se não tem pagamento: downgrade para free
 * - Se tem pagamento: já está no plano correto (não faz nada, limites são automáticos)
 * 
 * Esta função pode ser chamada periodicamente (cron) ou no login do usuário.
 */
export async function handleExpiredTrials() {
  const supabase = await createAdminClient()
  
  // Buscar usuários com trial expirado e sem pagamento
  const { data: expiredTrials } = await supabase
    .rpc('get_expired_trials_without_payment')
    .returns<{ user_id: string }[]>()
  
  // Como não temos a RPC ainda, fazemos manualmente:
  const { data: allSubs } = await supabase
    .from('user_subscriptions')
    .select('*')
  
  if (!allSubs) return

  for (const sub of allSubs) {
    const now = new Date()
    const trialEnd = new Date(sub.trial_start_date)
    trialEnd.setDate(trialEnd.getDate() + sub.trial_period_days)
    
    // Se trial expirou e não tem assinatura paga
    if (now > trialEnd && !sub.current_period_end) {
      // Garantir que está marcado como free (já deve estar, mas é garantia)
      if (sub.plan_group !== 'free') {
        await supabase
          .from('user_subscriptions')
          .update({ plan_group: 'free' })
          .eq('user_id', sub.user_id)
      }
    }
    
    // Se trial expirou e está inadimplente (período pago expirou)
    if (now > trialEnd && sub.current_period_end) {
      const periodEnd = new Date(sub.current_period_end)
      if (now > periodEnd) {
        // Downgrade para free
        await supabase
          .from('user_subscriptions')
          .update({ 
            plan_group: 'free',
            current_period_end: null,
            next_billing_date: null
          })
          .eq('user_id', sub.user_id)
      }
    }
  }
}

/**
 * Retorna informações sobre alertas de renovação.
 */
export async function getRenewalAlerts(userId: string): Promise<RenewalAlert | null> {
  const effectiveSub = await getEffectiveSubscription(userId)
  if (!effectiveSub) return null
  
  return effectiveSub.renewalAlert
}

// =====================================================
// FUNÇÕES DE COMPATIBILIDADE (deprecated, usar getEffectiveSubscription)
// =====================================================

/**
 * @deprecated Usar getEffectiveSubscription() no lugar
 * Mantido por compatibilidade temporária
 */
export type Subscription = {
  id: string
  user_id: string
  plan_id: string
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
  plan_snapshot: PlanLimits
  trial_ends_at: string | null
  current_period_start: string
  current_period_end: string | null
  asaas_customer_id: string | null
  asaas_subscription_id: string | null
  cancel_at_period_end: boolean
  notified_plan_id: string | null
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const effectiveSub = await getEffectiveSubscription(userId)
  if (!effectiveSub) return null
  
  // Retornar no formato antigo para não quebrar código existente
  return {
    id: effectiveSub.subscription.user_id,
    user_id: effectiveSub.subscription.user_id,
    plan_id: effectiveSub.effectivePlanGroup + '_monthly',
    status: effectiveSub.isInTrial ? 'trialing' : effectiveSub.isPaidUp ? 'active' : 'past_due',
    plan_snapshot: effectiveSub.limits,
    trial_ends_at: effectiveSub.trial.endsAt,
    current_period_start: effectiveSub.subscription.current_period_start || new Date().toISOString(),
    current_period_end: effectiveSub.subscription.current_period_end,
    asaas_customer_id: effectiveSub.subscription.asaas_customer_id,
    asaas_subscription_id: effectiveSub.subscription.asaas_subscription_id,
    cancel_at_period_end: false,
    notified_plan_id: null,
  }
}

/**
 * @deprecated Função antiga, não faz nada na nova estrutura
 */
export async function checkAndHandleExpiredTrial(userId: string) {
  // Na nova estrutura, isso é calculado automaticamente
  // Não precisa fazer nada, mantido só para compatibilidade
  return
}

/**
 * @deprecated Função antiga, agora é automático via getEffectiveSubscription
 */
export async function markPlanAsNotifiedAction() {
  // Na nova estrutura não precisamos mais desse controle
  // Mantido só para não quebrar código existente
  revalidatePath('/')
}
