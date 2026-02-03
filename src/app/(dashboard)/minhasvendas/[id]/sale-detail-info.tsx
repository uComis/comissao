'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, CreditCard, Calendar, Building2, User, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

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

export function SaleDetailInfo({ saleId, sale }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dados da Venda
              </CardTitle>
              <ChevronDown className={cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                open && 'rotate-180'
              )} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
          <div>
            {/* Identificação */}
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Pasta</p>
                  <p className="text-sm font-medium truncate">{sale.supplierName || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="text-sm font-medium truncate">{sale.clientName || '-'}</p>
                </div>
              </div>
            </div>

            {/* Valores */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Geral</p>
                  <p className="text-sm font-semibold">{formatCurrency(sale.grossValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Base de Cálculo</p>
                  <p className="text-sm font-semibold">{formatCurrency(sale.netValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Comissão</p>
                  <p className="text-sm font-semibold text-green-600">{formatCurrency(sale.commissionValue)}</p>
                </div>
              </div>
            </div>

            {/* Pagamento */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatPaymentCondition(sale.paymentCondition)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(sale.saleDate)}</span>
                </div>
              </div>
            </div>

            {/* Editar */}
            <div className="px-6 pb-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/minhasvendas/${saleId}/editar`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar dados
                </Link>
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
