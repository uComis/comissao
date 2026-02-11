import { SupabaseClient } from '@supabase/supabase-js'
import { DashboardService } from './dashboard-service'
import type { HomeDashboardData } from './dashboard-service'

type ReceivablesTotals = {
  totalPending: number
  totalOverdue: number
  totalReceived: number
  countPending: number
  countOverdue: number
  countReceived: number
}

type SupplierWithRule = {
  name: string
  cnpj: string | null
  ruleType: 'fixed' | 'tiered' | null
  commissionPercent: number | null
  taxPercent: number | null
}

type UpcomingReceivable = {
  clientName: string | null
  supplierName: string | null
  dueDate: string
  expectedCommission: number
  installmentNumber: number
  totalInstallments: number
  status: string
}

type UserPreferences = {
  commissionGoal: number
  userMode: string
}

type UserProfile = {
  full_name: string | null
  role: string | null
  organizations: { name: string } | null
}

type AuthUser = {
  id: string
  email?: string
  user_metadata?: { full_name?: string; name?: string }
}

type UserContext = {
  userName: string
  userEmail: string
  orgName: string
  userRole: string
  dashboard: HomeDashboardData | null
  receivables: ReceivablesTotals | null
  suppliers: SupplierWithRule[] | null
  clientCount: number | null
  preferences: UserPreferences | null
  upcomingReceivables: UpcomingReceivable[] | null
}

// Wraps a promise with a timeout (ms). Returns null on timeout.
function withTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

const DATA_TIMEOUT_MS = 8000

async function fetchReceivablesTotals(
  supabase: SupabaseClient,
  userId: string
): Promise<ReceivablesTotals> {
  const { data, error } = await supabase
    .from('v_receivables')
    .select('status, expected_commission')
    .eq('user_id', userId)

  if (error) throw error

  const rows = data || []
  const pending = rows.filter((r) => r.status === 'pending')
  const overdue = rows.filter((r) => r.status === 'overdue')
  const received = rows.filter((r) => r.status === 'received')

  return {
    totalPending: pending.reduce(
      (sum, r) => sum + (r.expected_commission || 0),
      0
    ),
    totalOverdue: overdue.reduce(
      (sum, r) => sum + (r.expected_commission || 0),
      0
    ),
    totalReceived: received.reduce(
      (sum, r) => sum + (r.expected_commission || 0),
      0
    ),
    countPending: pending.length,
    countOverdue: overdue.length,
    countReceived: received.length,
  }
}

async function fetchSuppliers(
  supabase: SupabaseClient,
  userId: string
): Promise<SupplierWithRule[]> {
  const { data, error } = await supabase
    .from('personal_suppliers')
    .select(
      'name, cnpj, commission_rules(type, commission_percentage, tax_percentage, is_default)'
    )
    .eq('user_id', userId)
    .order('name')

  if (error) throw error

  return (data || []).map((s: any) => {
    const rules = s.commission_rules || []
    const defaultRule = rules.find((r: any) => r.is_default) || rules[0] || null
    return {
      name: s.name,
      cnpj: s.cnpj,
      ruleType: defaultRule?.type || null,
      commissionPercent: defaultRule?.commission_percentage || null,
      taxPercent: defaultRule?.tax_percentage || null,
    }
  })
}

async function fetchClientCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('personal_clients')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) throw error
  return count || 0
}

async function fetchPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('commission_goal, user_mode')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows

  return {
    commissionGoal: data?.commission_goal || 0,
    userMode: data?.user_mode || 'personal',
  }
}

async function fetchUpcomingReceivables(
  supabase: SupabaseClient,
  userId: string
): Promise<UpcomingReceivable[]> {
  const today = new Date().toISOString().split('T')[0]
  const in14Days = new Date(Date.now() + 14 * 86400000)
    .toISOString()
    .split('T')[0]

  const { data, error } = await supabase
    .from('v_receivables')
    .select(
      'client_name, supplier_name, due_date, expected_commission, installment_number, total_installments, status'
    )
    .eq('user_id', userId)
    .in('status', ['pending', 'overdue'])
    .lte('due_date', in14Days)
    .order('due_date')
    .limit(20)

  if (error) throw error

  return (data || []).map((r: any) => ({
    clientName: r.client_name,
    supplierName: r.supplier_name,
    dueDate: r.due_date,
    expectedCommission: r.expected_commission,
    installmentNumber: r.installment_number,
    totalInstallments: r.total_installments,
    status: r.status,
  }))
}

function resolveUserName(
  profile: UserProfile | null,
  user: AuthUser
): string {
  return (
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    'Usuário'
  )
}

export async function getUserContext(
  supabase: SupabaseClient,
  user: AuthUser,
  profile: UserProfile | null
): Promise<UserContext> {
  // Busca dados em paralelo com fallback individual
  const [dashboard, receivables, suppliers, clientCount, preferences, upcomingReceivables] =
    (await withTimeout(
      Promise.all([
        DashboardService.getHomeAnalytics().catch(() => null),
        fetchReceivablesTotals(supabase, user.id).catch(() => null),
        fetchSuppliers(supabase, user.id).catch(() => null),
        fetchClientCount(supabase, user.id).catch(() => null),
        fetchPreferences(supabase, user.id).catch(() => null),
        fetchUpcomingReceivables(supabase, user.id).catch(() => null),
      ]),
      DATA_TIMEOUT_MS
    )) ?? [null, null, null, null, null, null]

  return {
    userName: resolveUserName(profile, user),
    userEmail: user.email || '',
    orgName: profile?.organizations?.name || 'Não informada',
    userRole: profile?.role || 'Não informado',
    dashboard,
    receivables,
    suppliers,
    clientCount,
    preferences,
    upcomingReceivables,
  }
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

function trendLabel(trend: number): string {
  if (trend > 0) return `+${trend}% vs mês anterior`
  if (trend < 0) return `${trend}% vs mês anterior`
  return 'sem variação vs mês anterior'
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function formatForPrompt(ctx: UserContext): string {
  const sections: string[] = []

  // Identidade
  sections.push(
    `## Usuário\n- Nome: ${ctx.userName}\n- Email: ${ctx.userEmail}\n- Organização: ${ctx.orgName}\n- Cargo: ${ctx.userRole}`
  )

  // Preferências
  if (ctx.preferences) {
    const goalStr =
      ctx.preferences.commissionGoal > 0
        ? formatCurrency(ctx.preferences.commissionGoal)
        : 'Não definida'
    sections.push(
      `## Preferências\n- Meta de comissão mensal: ${goalStr}\n- Modo: ${ctx.preferences.userMode}`
    )
  }

  const d = ctx.dashboard
  if (d) {
    const c = d.cards

    // Comissão
    const goalLine =
      c.commission.goal > 0
        ? `Meta: ${formatCurrency(c.commission.goal)} | Progresso: ${formatPercent(c.commission.progress)} | Falta: ${formatCurrency(c.commission.remaining)}`
        : 'Sem meta definida'
    sections.push(
      `## Comissão do Mês\n- Total: ${formatCurrency(c.commission.current)}\n- ${goalLine}`
    )

    // Vendas
    sections.push(
      `## Vendas do Mês\n- Quantidade: ${c.sales_performed.value} (${trendLabel(c.sales_performed.trend)})\n- Valor bruto: ${formatCurrency(c.total_sales.value)} (${trendLabel(c.total_sales.trend)})`
    )

    // Financeiro mensal
    sections.push(
      `## Financeiro do Mês\n- Recebido: ${formatCurrency(c.finance.received)}\n- Pendente: ${formatCurrency(c.finance.pending)}\n- Vencido: ${formatCurrency(c.finance.overdue)}`
    )

    // Rankings
    if (d.rankings.clients.length > 0) {
      const lines = d.rankings.clients
        .map((r, i) => `${i + 1}. ${r.name}: ${formatCurrency(r.value)}`)
        .join('\n')
      sections.push(`## Top Clientes (mês)\n${lines}`)
    }

    if (d.rankings.folders.length > 0) {
      const lines = d.rankings.folders
        .map((r, i) => `${i + 1}. ${r.name}: ${formatCurrency(r.value)}`)
        .join('\n')
      sections.push(`## Top Pastas/Fornecedores (mês)\n${lines}`)
    }
  }

  // Recebíveis totais
  const r = ctx.receivables
  if (r) {
    sections.push(
      `## Recebíveis (geral)\n- Pendentes: ${r.countPending} parcelas — ${formatCurrency(r.totalPending)}\n- Vencidos: ${r.countOverdue} parcelas — ${formatCurrency(r.totalOverdue)}\n- Recebidos: ${r.countReceived} parcelas — ${formatCurrency(r.totalReceived)}`
    )
  }

  // Pastas (fornecedores) com regras
  if (ctx.suppliers && ctx.suppliers.length > 0) {
    const lines = ctx.suppliers.map((s) => {
      let rule = 'sem regra configurada'
      if (s.ruleType === 'fixed' && s.commissionPercent != null) {
        rule = `comissão fixa ${s.commissionPercent}%`
        if (s.taxPercent) rule += `, taxa ${s.taxPercent}%`
      } else if (s.ruleType === 'tiered') {
        rule = 'comissão escalonada (por faixa)'
        if (s.taxPercent) rule += `, taxa ${s.taxPercent}%`
      }
      return `- ${s.name}: ${rule}`
    })
    sections.push(
      `## Pastas do Usuário (${ctx.suppliers.length} total)\n${lines.join('\n')}`
    )
  } else if (ctx.suppliers) {
    sections.push('## Pastas do Usuário\nNenhuma pasta cadastrada.')
  }

  // Clientes
  if (ctx.clientCount != null) {
    sections.push(`## Clientes\n- Total cadastrados: ${ctx.clientCount}`)
  }

  // Recebíveis próximos
  if (ctx.upcomingReceivables && ctx.upcomingReceivables.length > 0) {
    const lines = ctx.upcomingReceivables.map((r) => {
      const statusLabel = r.status === 'overdue' ? 'ATRASADO' : 'a receber'
      return `- ${formatDate(r.dueDate)} | ${formatCurrency(r.expectedCommission)} | ${r.clientName || '?'} (${r.supplierName || '?'}) | parcela ${r.installmentNumber}/${r.totalInstallments} | ${statusLabel}`
    })
    sections.push(
      `## Próximos Recebíveis (14 dias)\n${lines.join('\n')}`
    )
  }

  if (!d && !r) {
    sections.push(
      '## Dados\nNão foi possível carregar dados do usuário neste momento.'
    )
  }

  return sections.join('\n\n')
}
