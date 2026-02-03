import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getPersonalSaleById } from '@/app/actions/personal-sales'
import { getReceivables } from '@/app/actions/receivables'
import { SaleDetailHeader } from './page-header-setter'
import { SaleDetailSummary } from './sale-detail-summary'
import { SaleDetailInstallments } from './sale-detail-installments'
import { SaleDetailInfo } from './sale-detail-info'
import { FadeIn } from '@/components/ui/fade-in'

type Props = {
  params: Promise<{ id: string }>
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const finalStr = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`
  return new Intl.DateTimeFormat('pt-BR').format(new Date(finalStr))
}

async function VendaDetalheContent({ id }: { id: string }) {
  const sale = await getPersonalSaleById(id)

  if (!sale) {
    notFound()
  }

  const allReceivables = await getReceivables()
  const saleReceivables = allReceivables
    .filter(r => r.personal_sale_id === id)
    .sort((a, b) => a.installment_number - b.installment_number)

  // Calculate totals
  const totalReceived = saleReceivables
    .filter(r => r.status === 'received')
    .reduce((sum, r) => sum + (r.received_amount || r.expected_commission || 0), 0)

  const totalOverdue = saleReceivables
    .filter(r => r.status === 'overdue')
    .reduce((sum, r) => sum + (r.expected_commission || 0), 0)

  const totalPending = saleReceivables
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + (r.expected_commission || 0), 0)

  return (
    <FadeIn className="mx-auto max-w-2xl">
      <SaleDetailHeader id={id} clientName={sale.client_name} saleDate={formatDate(sale.sale_date)} />

      <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-150">
        {/* Resumo Financeiro */}
        <SaleDetailSummary
          totalReceived={totalReceived}
          totalOverdue={totalOverdue}
          totalPending={totalPending}
        />

        {/* Parcelas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Parcelas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <SaleDetailInstallments
              saleId={id}
              receivables={saleReceivables}
            />
          </CardContent>
        </Card>

        {/* Dados da Venda (colapsável) */}
        <SaleDetailInfo
          saleId={id}
          sale={{
            supplierName: sale.supplier?.name || null,
            clientName: sale.client_name,
            grossValue: sale.gross_value,
            netValue: sale.net_value,
            commissionValue: sale.commission_value,
            paymentCondition: sale.payment_condition,
            saleDate: sale.sale_date,
          }}
        />

        {/* Observações */}
        {sale.notes && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Observações
              </p>
              <p className="text-sm">{sale.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </FadeIn>
  )
}

function VendaDetalheLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mt-5 space-y-4">
        {/* Summary skeleton */}
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        {/* Installments skeleton */}
        <Skeleton className="h-[300px] rounded-xl" />
        {/* Info skeleton */}
        <Skeleton className="h-12 rounded-xl" />
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
