import { SupabaseClient } from '@supabase/supabase-js'
import { DashboardService } from './dashboard-service'
import type { HomeDashboardData } from './dashboard-service'

// =====================================================
// TYPES
// =====================================================

type SupplierWithRule = {
  name: string
  cnpj: string | null
  ruleType: 'fixed' | 'tiered' | null
  commissionPercent: number | null
  taxPercent: number | null
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

// Light base context — always loaded (~200 tokens)
type BaseContext = {
  userName: string
  userEmail: string
  supplierCount: number
  clientCount: number
  saleCount: number
  today: string
}

// =====================================================
// HELPERS
// =====================================================

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

// =====================================================
// BASE CONTEXT (always loaded — light)
// =====================================================

export async function getBaseContext(
  supabase: SupabaseClient,
  user: AuthUser,
  profile: UserProfile | null
): Promise<BaseContext> {
  // 3 fast count queries in parallel
  const [supplierCount, clientCount, saleCount] = await Promise.all([
    supabase
      .from('personal_suppliers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => count || 0),
    supabase
      .from('personal_clients')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .then(({ count }) => count || 0),
    supabase
      .from('personal_sales')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => count || 0),
  ])

  return {
    userName: resolveUserName(profile, user),
    userEmail: user.email || '',
    supplierCount,
    clientCount,
    saleCount,
    today: new Date().toISOString().split('T')[0],
  }
}

export function formatBaseContext(ctx: BaseContext): string {
  return `## Usuário
- Nome: ${ctx.userName}
- Email: ${ctx.userEmail}
- Data de hoje: ${ctx.today}

## Resumo
- ${ctx.supplierCount} pasta(s) cadastrada(s)
- ${ctx.clientCount} cliente(s) ativo(s)
- ${ctx.saleCount} venda(s) registrada(s)`
}

// =====================================================
// QUERY TOOL HANDLERS (called on demand)
// =====================================================

export async function fetchDashboardData(): Promise<string> {
  const d = await DashboardService.getHomeAnalytics()
  if (!d) return JSON.stringify({ error: 'Não foi possível carregar o dashboard.' })

  const c = d.cards
  const sections: string[] = []

  // Comissão
  const goalLine =
    c.commission.goal > 0
      ? `Meta: ${formatCurrency(c.commission.goal)} | Progresso: ${formatPercent(c.commission.progress)} | Falta: ${formatCurrency(c.commission.remaining)}`
      : 'Sem meta definida'
  sections.push(`Comissão do Mês: ${formatCurrency(c.commission.current)} (${goalLine})`)

  // Vendas
  sections.push(
    `Vendas do Mês: ${c.sales_performed.value} vendas (${trendLabel(c.sales_performed.trend)}), valor bruto ${formatCurrency(c.total_sales.value)} (${trendLabel(c.total_sales.trend)})`
  )

  // Financeiro
  sections.push(
    `Financeiro: Recebido ${formatCurrency(c.finance.received)} | Pendente ${formatCurrency(c.finance.pending)} | Vencido ${formatCurrency(c.finance.overdue)}`
  )

  // Rankings
  if (d.rankings.clients.length > 0) {
    const lines = d.rankings.clients.map((r, i) => `${i + 1}. ${r.name}: ${formatCurrency(r.value)}`).join(', ')
    sections.push(`Top Clientes: ${lines}`)
  }
  if (d.rankings.folders.length > 0) {
    const lines = d.rankings.folders.map((r, i) => `${i + 1}. ${r.name}: ${formatCurrency(r.value)}`).join(', ')
    sections.push(`Top Pastas: ${lines}`)
  }

  return JSON.stringify({ dashboard: sections.join('\n') })
}

export async function fetchSupplierList(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data, error } = await supabase
    .from('personal_suppliers')
    .select(
      'name, cnpj, commission_rules(type, commission_percentage, tax_percentage, is_default)'
    )
    .eq('user_id', userId)
    .order('name')

  if (error) return JSON.stringify({ error: 'Erro ao buscar pastas.' })

  const suppliers: SupplierWithRule[] = (data || []).map((s: any) => {
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

  if (suppliers.length === 0) {
    return JSON.stringify({ suppliers: [], message: 'Nenhuma pasta cadastrada.' })
  }

  const lines = suppliers.map((s) => {
    let rule = 'sem regra configurada'
    if (s.ruleType === 'fixed' && s.commissionPercent != null) {
      rule = `comissão fixa ${s.commissionPercent}%`
      if (s.taxPercent) rule += `, taxa ${s.taxPercent}%`
    } else if (s.ruleType === 'tiered') {
      rule = 'comissão escalonada (por faixa)'
      if (s.taxPercent) rule += `, taxa ${s.taxPercent}%`
    }
    return `- ${s.name}${s.cnpj ? ` (CNPJ: ${s.cnpj})` : ''}: ${rule}`
  })

  return JSON.stringify({ suppliers: lines.join('\n'), total: suppliers.length })
}

export async function fetchClientList(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data, error } = await supabase
    .from('personal_clients')
    .select('name, phone, email, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('name')
    .limit(50)

  if (error) return JSON.stringify({ error: 'Erro ao buscar clientes.' })
  if (!data || data.length === 0) {
    return JSON.stringify({ clients: [], message: 'Nenhum cliente cadastrado.' })
  }

  const lines = data.map((c: any) => {
    const details = [c.phone, c.email].filter(Boolean).join(', ')
    return `- ${c.name}${details ? ` (${details})` : ''}`
  })

  return JSON.stringify({ clients: lines.join('\n'), total: data.length })
}

export async function fetchReceivablesTotals(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data, error } = await supabase
    .from('v_receivables')
    .select('status, expected_commission')
    .eq('user_id', userId)

  if (error) return JSON.stringify({ error: 'Erro ao buscar recebíveis.' })

  const rows = data || []
  const pending = rows.filter((r) => r.status === 'pending')
  const overdue = rows.filter((r) => r.status === 'overdue')
  const received = rows.filter((r) => r.status === 'received')

  const totals = {
    pendentes: `${pending.length} parcelas — ${formatCurrency(pending.reduce((s, r) => s + (r.expected_commission || 0), 0))}`,
    vencidos: `${overdue.length} parcelas — ${formatCurrency(overdue.reduce((s, r) => s + (r.expected_commission || 0), 0))}`,
    recebidos: `${received.length} parcelas — ${formatCurrency(received.reduce((s, r) => s + (r.expected_commission || 0), 0))}`,
  }

  return JSON.stringify({ receivables_totals: totals })
}

export async function fetchHistoricalData(
  supabase: SupabaseClient,
  userId: string,
  dateFrom: string,
  dateTo: string
): Promise<string> {
  // Fetch sales in period
  const { data: sales, error: salesError } = await supabase
    .from('personal_sales')
    .select('sale_date, gross_value, net_value, commission_value, personal_clients(name), personal_suppliers(name)')
    .eq('user_id', userId)
    .gte('sale_date', dateFrom)
    .lte('sale_date', dateTo)
    .order('sale_date', { ascending: false })
    .limit(50)

  if (salesError) return JSON.stringify({ error: 'Erro ao buscar histórico.' })

  if (!sales || sales.length === 0) {
    return JSON.stringify({ message: `Nenhuma venda encontrada entre ${formatDate(dateFrom)} e ${formatDate(dateTo)}.` })
  }

  const totalGross = sales.reduce((s, v: any) => s + (v.gross_value || 0), 0)
  const totalCommission = sales.reduce((s, v: any) => s + (v.commission_value || 0), 0)

  const lines = sales.map((v: any) => {
    const client = v.personal_clients?.name || '?'
    const supplier = v.personal_suppliers?.name || '?'
    return `- ${formatDate(v.sale_date)}: ${client} (${supplier}) — bruto ${formatCurrency(v.gross_value)}, comissão ${formatCurrency(v.commission_value)}`
  })

  return JSON.stringify({
    period: `${formatDate(dateFrom)} a ${formatDate(dateTo)}`,
    total_sales: sales.length,
    total_gross: formatCurrency(totalGross),
    total_commission: formatCurrency(totalCommission),
    sales: lines.join('\n'),
  })
}

// =====================================================
// BACKWARD COMPAT — old getUserContext (deprecated)
// =====================================================

/** @deprecated Use getBaseContext + query tools instead */
export async function getUserContext(
  supabase: SupabaseClient,
  user: AuthUser,
  profile: UserProfile | null
) {
  const base = await getBaseContext(supabase, user, profile)
  return base
}

/** @deprecated Use formatBaseContext instead */
export function formatForPrompt(ctx: BaseContext): string {
  return formatBaseContext(ctx)
}
