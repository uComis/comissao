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

type UserProfile = {
  full_name: string | null
  role: string | null
  organizations: { name: string } | null
}

type UserContext = {
  userName: string
  userEmail: string
  orgName: string
  userRole: string
  dashboard: HomeDashboardData | null
  receivables: ReceivablesTotals | null
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

export async function getUserContext(
  supabase: SupabaseClient,
  user: { id: string; email?: string },
  profile: UserProfile | null
): Promise<UserContext> {
  // Busca dados em paralelo com fallback individual
  const [dashboard, receivables] = await withTimeout(
    Promise.all([
      DashboardService.getHomeAnalytics().catch(() => null),
      fetchReceivablesTotals(supabase, user.id).catch(() => null),
    ]),
    DATA_TIMEOUT_MS
  ) ?? [null, null]

  return {
    userName: profile?.full_name || 'Usuário',
    userEmail: user.email || '',
    orgName: profile?.organizations?.name || 'Não informada',
    userRole: profile?.role || 'Não informado',
    dashboard,
    receivables,
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

export function formatForPrompt(ctx: UserContext): string {
  const sections: string[] = []

  // Identidade
  sections.push(
    `## Usuário\n- Nome: ${ctx.userName}\n- Email: ${ctx.userEmail}\n- Organização: ${ctx.orgName}\n- Cargo: ${ctx.userRole}`
  )

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

  if (!d && !r) {
    sections.push(
      '## Dados\nNão foi possível carregar dados do usuário neste momento.'
    )
  }

  return sections.join('\n\n')
}
