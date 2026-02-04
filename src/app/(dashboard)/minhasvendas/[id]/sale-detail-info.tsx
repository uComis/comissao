'use client'

import Link from 'next/link'
import { CreditCard, Calendar, Building2, User, Pencil, DollarSign, Calculator, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

type SaleInfo = {
  supplierName: string | null
  clientName: string | null
  grossValue: number | null
  netValue: number | null
  commissionValue: number | null
  paymentCondition: string | null
  saleDate: string | null
}

type Props = {
  saleId: string
  sale: SaleInfo
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
  const finalStr = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`
  return new Intl.DateTimeFormat('pt-BR').format(new Date(finalStr))
}

function formatPaymentCondition(condition: string | null): string {
  if (!condition || condition.trim() === '') {
    return 'À vista'
  }

  const parts = condition.split('/').map(p => parseInt(p.trim())).filter(n => !isNaN(n))

  if (parts.length === 0) return 'À vista'
  if (parts.length === 1) return `Pagamento em ${parts[0]} dias`

  const interval = parts[1] - parts[0]
  const isUniform = parts.every((val, i) => i === 0 || val - parts[i - 1] === interval)

  if (isUniform && interval > 0) {
    return `${parts.length}x a cada ${interval} dias`
  }

  if (parts.length > 3) {
    return `${parts.slice(0, 3).join('/')}...`
  }

  return condition
}

export function SaleDetailInfo({ saleId, sale }: Props) {
  return (
    <Link href={`/minhasvendas/${saleId}/editar`} className="block">
      <Card className="gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{formatDate(sale.saleDate)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{formatPaymentCondition(sale.paymentCondition)}</span>
              </div>
            </div>
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Pasta e Cliente */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Pasta</p>
                <p className="text-sm font-medium truncate">{sale.supplierName || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="text-sm font-medium truncate">{sale.clientName || '-'}</p>
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Total Geral</p>
                <p className="text-sm font-semibold">{formatCurrency(sale.grossValue)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Base Cálculo</p>
                <p className="text-sm font-semibold">{formatCurrency(sale.netValue)}</p>
              </div>
            </div>
          </div>

          {/* Comissão */}
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Comissão</p>
              <p className="text-sm font-semibold text-green-600">{formatCurrency(sale.commissionValue)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
