import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getDashboardSummary, getDashboardHistory } from '@/app/actions/commissions'
import { PrintButton } from '@/components/print-button'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatShortPeriod(period: string): string {
  const [year, month] = period.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(date)
}

function getCurrentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

type Props = {
  searchParams: Promise<{ mes?: string }>
}

export default async function ImpressaoDashboardPage({ searchParams }: Props) {
  const params = await searchParams
  const period = params.mes ?? getCurrentPeriod()

  // Autenticação e organização
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Busca organização pelo owner_id (mesma lógica do OrganizationContext)
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  if (!organization) {
    redirect('/login')
  }

  // Busca dados
  const [summary, history] = await Promise.all([
    getDashboardSummary(organization.id, period),
    getDashboardHistory(organization.id, 6),
  ])

  const now = new Date()
  const generatedAt = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(now)

  return (
    <div className="p-4 max-w-[210mm] mx-auto">
      {/* Cabeçalho */}
      <header className="mb-6 pb-3 border-b-2 border-gray-300">
        <h1 className="text-xl font-bold">{organization.name}</h1>
        <p className="text-base text-gray-600">Relatório de Dashboard — {formatPeriodLabel(period)}</p>
        <p className="text-xs text-gray-400 mt-1">Gerado em {generatedAt}</p>
      </header>

      {/* Resumo do período */}
      <section className="mb-6">
        <h2 className="text-base font-semibold mb-3 border-b border-gray-200 pb-2">
          Resumo do Período
        </h2>
        <table className="w-full text-sm border-collapse text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2">Total de Vendas</th>
              <th className="border border-gray-300 px-3 py-2">Valor Bruto</th>
              <th className="border border-gray-300 px-3 py-2">Valor Líquido</th>
              <th className="border border-gray-300 px-3 py-2">Total Comissões</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2 text-lg font-bold">{summary.total_sales}</td>
              <td className="border border-gray-300 px-3 py-2 text-lg font-bold">{formatCurrency(summary.total_gross_value)}</td>
              <td className="border border-gray-300 px-3 py-2 text-lg font-bold">{formatCurrency(summary.total_net_value)}</td>
              <td className="border border-gray-300 px-3 py-2 text-lg font-bold text-green-700">{formatCurrency(summary.total_commission)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Evolução - últimos 6 meses */}
      <section className="mb-6">
        <h2 className="text-base font-semibold mb-3 border-b border-gray-200 pb-2">
          Evolução (Últimos 6 meses)
        </h2>
        <table className="w-full text-sm border-collapse text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2">Período</th>
              <th className="border border-gray-300 px-3 py-2">Vendas</th>
              <th className="border border-gray-300 px-3 py-2">Bruto</th>
              <th className="border border-gray-300 px-3 py-2">Líquido</th>
              <th className="border border-gray-300 px-3 py-2">Comissão</th>
            </tr>
          </thead>
          <tbody>
            {history.periods.map((p) => (
              <tr key={p.period} className={p.period === period ? 'bg-yellow-50' : ''}>
                <td className="border border-gray-300 px-3 py-2">{formatShortPeriod(p.period)}</td>
                <td className="border border-gray-300 px-3 py-2">{p.total_sales}</td>
                <td className="border border-gray-300 px-3 py-2">{formatCurrency(p.total_gross_value)}</td>
                <td className="border border-gray-300 px-3 py-2">{formatCurrency(p.total_net_value)}</td>
                <td className="border border-gray-300 px-3 py-2 font-medium">{formatCurrency(p.total_commission)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Vendedores do período */}
      <section className="mb-6">
        <h2 className="text-base font-semibold mb-3 border-b border-gray-200 pb-2">
          Vendedores — {formatPeriodLabel(period)}
        </h2>
        {summary.sellers.length === 0 ? (
          <p className="text-gray-500 italic">Nenhuma venda no período</p>
        ) : (
          <table className="w-full text-sm border-collapse text-center">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2">Vendedor</th>
                <th className="border border-gray-300 px-3 py-2">Vendas</th>
                <th className="border border-gray-300 px-3 py-2">Total Bruto</th>
                <th className="border border-gray-300 px-3 py-2">Total Líquido</th>
                <th className="border border-gray-300 px-3 py-2">Comissão</th>
              </tr>
            </thead>
            <tbody>
              {summary.sellers.map((seller) => {
                const percentage = summary.total_commission > 0
                  ? (seller.total_commission / summary.total_commission) * 100
                  : 0
                return (
                  <tr key={seller.seller_id}>
                    <td className="border border-gray-300 px-3 py-2 font-medium">{seller.seller_name}</td>
                    <td className="border border-gray-300 px-3 py-2">{seller.sales_count}</td>
                    <td className="border border-gray-300 px-3 py-2">{formatCurrency(seller.total_gross_value)}</td>
                    <td className="border border-gray-300 px-3 py-2">{formatCurrency(seller.total_net_value)}</td>
                    <td className="border border-gray-300 px-3 py-2 font-medium text-green-700">
                      {formatCurrency(seller.total_commission)}
                      <span className="text-xs text-gray-500 ml-1">({percentage.toFixed(1)}%)</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td className="border border-gray-300 px-3 py-2">TOTAL</td>
                <td className="border border-gray-300 px-3 py-2">{summary.total_sales}</td>
                <td className="border border-gray-300 px-3 py-2">{formatCurrency(summary.total_gross_value)}</td>
                <td className="border border-gray-300 px-3 py-2">{formatCurrency(summary.total_net_value)}</td>
                <td className="border border-gray-300 px-3 py-2 text-green-700">
                  {formatCurrency(summary.total_commission)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      {/* Performance por vendedor (histórico) */}
      {history.sellers.length > 0 && (
        <section className="mb-6 print:break-before-page">
          <h2 className="text-base font-semibold mb-3 border-b border-gray-200 pb-2">
            Histórico de Comissões por Vendedor
          </h2>
          <table className="w-full text-sm border-collapse text-center">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2">Vendedor</th>
                {history.periods.map((p) => (
                  <th key={p.period} className="border border-gray-300 px-3 py-2">
                    {formatShortPeriod(p.period)}
                  </th>
                ))}
                <th className="border border-gray-300 px-3 py-2 bg-gray-200">Total</th>
              </tr>
            </thead>
            <tbody>
              {history.sellers.slice(0, 10).map((seller) => {
                const total = seller.data.reduce((sum, d) => sum + d.commission, 0)
                return (
                  <tr key={seller.seller_id}>
                    <td className="border border-gray-300 px-3 py-2 font-medium">{seller.seller_name}</td>
                    {seller.data.map((d) => (
                      <td key={d.period} className="border border-gray-300 px-3 py-2">
                        {d.commission > 0 ? formatCurrency(d.commission) : '-'}
                      </td>
                    ))}
                    <td className="border border-gray-300 px-3 py-2 font-bold bg-gray-50">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {history.sellers.length > 10 && (
            <p className="text-sm text-gray-500 mt-2 italic">
              Exibindo os 10 vendedores com maior comissão total
            </p>
          )}
        </section>
      )}

      <PrintButton />
    </div>
  )
}

