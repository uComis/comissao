import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Calendar, CreditCard } from 'lucide-react'
import { getPersonalSaleById } from '@/app/actions/personal-sales'
import { getReceivables } from '@/app/actions/receivables'
import { SaleDetailHeader } from './page-header-setter'
import { SaleDetailReceivables } from './sale-detail-receivables'
import { FadeIn } from '@/components/ui/fade-in'

type Props = {
  params: Promise<{ id: string }>
}

function formatCurrency(value: number | null): string {
  if (value === null) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr + 'T00:00:00'))
}

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr + 'T00:00:00')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${date.getDate()} de ${months[date.getMonth()]}. ${date.getFullYear()}`
}

function formatPaymentCondition(condition: string | null): string {
  if (!condition || condition.trim() === '') {
    return 'À vista'
  }

  const parts = condition.split('/').map(p => parseInt(p.trim())).filter(n => !isNaN(n))

  if (parts.length === 0) return 'À vista'
  if (parts.length === 1) return `${parts[0]} dias`

  const interval = parts[1] - parts[0]
  const isUniform = parts.every((val, i) => i === 0 || val - parts[i - 1] === interval)

  if (isUniform && interval > 0) {
    return `${parts.length}x, intervalo de ${interval} dias`
  }

  if (parts.length > 3) {
    return `${parts.slice(0, 3).join('/')}...`
  }

  return condition
}

function parsePaymentCondition(condition: string | null): number[] {
  if (!condition || condition.trim() === '') return [0]
  const parts = condition.split('/').map(p => parseInt(p.trim())).filter(n => !isNaN(n))
  return parts.length > 0 ? parts : [0]
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

async function VendaDetalheContent({ id }: { id: string }) {
  const sale = await getPersonalSaleById(id)

  if (!sale) {
    notFound()
  }

  const allReceivables = await getReceivables()
  const saleReceivables = allReceivables.filter(r => r.personal_sale_id === id)

  const totalReceived = saleReceivables
    .filter(r => r.status === 'received')
    .reduce((sum, r) => sum + (r.received_amount || 0), 0)

  const totalOverdue = saleReceivables
    .filter(r => r.status === 'overdue')
    .reduce((sum, r) => sum + (r.expected_commission || 0), 0)

  const totalDue = saleReceivables
    .filter(r => r.status === 'pending' || r.status === 'overdue')
    .reduce((sum, r) => sum + (r.expected_commission || 0), 0)

  // Verificar se há itens detalhados ou apenas valor agregado
  const hasDetailedItems = (() => {
    if (!sale.items || sale.items.length === 0) return false
    const allItemsAreAggregated = sale.items.every(item =>
      item.product_name === 'Valor' && !item.product_id
    )
    return !allItemsAreAggregated
  })()

  // Calcular parcelas para o componente de recebimentos
  const baseDate = new Date((sale.sale_date || new Date().toISOString().split('T')[0]) + 'T12:00:00')
  const days = parsePaymentCondition(sale.payment_condition)
  const totalValue = sale.gross_value || 0
  const commissionValue = sale.commission_value || 0
  const installmentValue = totalValue / days.length
  const commissionPerInstallment = commissionValue / days.length
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const installments = days.map((dayOffset, i) => {
    const dueDate = addDays(baseDate, dayOffset)
    const dueDateNormalized = new Date(dueDate)
    dueDateNormalized.setHours(0, 0, 0, 0)
    return {
      number: i + 1,
      dueDate: dueDate.toISOString(),
      value: installmentValue,
      commission: commissionPerInstallment,
      isPast: dueDateNormalized < today,
    }
  })

  const hasReceivableStatus = saleReceivables.length > 0

  return (
    <FadeIn className="mx-auto max-w-2xl">
      <SaleDetailHeader id={id} clientName={sale.client_name} saleDate={formatDate(sale.sale_date)} />

      <div className="mt-5 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-150">
        <Card>
          <CardContent className="p-0">

            {/* === IDENTIFICAÇÃO === */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Identificação</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pasta</p>
                  <p className="font-medium">{sale.supplier?.name || '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{sale.client_name || '-'}</p>
                </div>
              </div>
            </div>

            {/* === VALORES === */}
            <div className="border-t px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Valores</p>

              {hasDetailedItems ? (
                <div className="space-y-2">
                  {sale.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity}x {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs px-1.5 py-0">
                          {item.tax_rate?.toFixed(1) || '0'}%
                        </Badge>
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs px-1.5 py-0">
                          {item.commission_rate?.toFixed(1) || '0'}%
                        </Badge>
                        <span className="text-sm font-medium w-24 text-right">{formatCurrency(item.total_price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {sale.items && sale.items.length > 0 && sale.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
                      <span className="text-sm font-medium">{formatCurrency(item.total_price)}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs px-1.5 py-0">
                          {item.tax_rate?.toFixed(1) || '0'}% tx
                        </Badge>
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs px-1.5 py-0">
                          {item.commission_rate?.toFixed(1) || '0'}% cm
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totais */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Geral</p>
                  <p className="font-medium">{formatCurrency(sale.gross_value)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Base de Cálculo</p>
                  <p className="font-medium">{formatCurrency(sale.net_value)}</p>
                </div>
              </div>

              {/* Comissão destaque */}
              <div className="mt-4 rounded-lg bg-green-500/5 border border-green-500/10 px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-wider text-green-600 font-semibold">Sua Comissão</p>
                <p className="text-2xl font-bold text-green-600 mt-0.5">{formatCurrency(sale.commission_value)}</p>
              </div>
            </div>

            {/* === PAGAMENTO === */}
            <div className="border-t px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pagamento</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatPaymentCondition(sale.payment_condition)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatShortDate(sale.sale_date)}</span>
                </div>
              </div>
            </div>

            {/* === RECEBIMENTOS === */}
            <div className="border-t px-5 py-4">
              <SaleDetailReceivables installments={installments} />
            </div>

            {/* === STATUS === */}
            {hasReceivableStatus && (
              <div className="border-t px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Status</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Recebido</span>
                    <span className="text-green-600 font-semibold">{formatCurrency(totalReceived)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Atrasado</span>
                    <span className="text-red-600 font-semibold">{formatCurrency(totalOverdue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Devido</span>
                    <span className="font-semibold">{formatCurrency(totalDue)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* === OBSERVAÇÕES === */}
            {sale.notes && (
              <div className="border-t px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Observações</p>
                <p className="text-sm">{sale.notes}</p>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </FadeIn>
  )
}

function VendaDetalheLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mt-5">
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    </div>
  )
}

export default async function VendaDetalhePage({ params }: Props) {
  const { id } = await params

  return (
    <Suspense fallback={<VendaDetalheLoading />}>
      <VendaDetalheContent id={id} />
    </Suspense>
  )
}
