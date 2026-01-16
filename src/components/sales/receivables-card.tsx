'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type InstallmentRow = {
  number: number
  dueDate: Date
  value: number
  commission: number
  isPast: boolean
}

type Props = {
  saleDate: string
  paymentCondition: string | null
  totalValue: number
  commissionValue: number
  commissionRate: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function parsePaymentCondition(condition: string | null): number[] {
  if (!condition || condition.trim() === '') {
    return [0] // À vista
  }

  const parts = condition.split('/').map(p => parseInt(p.trim())).filter(n => !isNaN(n))
  return parts.length > 0 ? parts : [0]
}

function formatPaymentCondition(condition: string | null): string {
  if (!condition || condition.trim() === '') {
    return 'À vista'
  }

  const parts = condition.split('/').map(p => parseInt(p.trim())).filter(n => !isNaN(n))
  
  if (parts.length === 0) {
    return 'À vista'
  }

  if (parts.length === 1) {
    return `${parts[0]} dias`
  }

  // Detectar intervalo uniforme
  const interval = parts[1] - parts[0]
  const isUniform = parts.every((val, i) => i === 0 || val - parts[i - 1] === interval)

  if (isUniform && interval > 0) {
    return `${parts.length}x, intervalo de ${interval} dias`
  }

  // Fallback: mostrar primeiros 3 + ...
  if (parts.length > 3) {
    return `${parts.slice(0, 3).join('/')}...`
  }

  return condition
}

export function ReceivablesCard({
  saleDate,
  paymentCondition,
  totalValue,
  commissionValue,
  commissionRate,
}: Props) {
  const [showAll, setShowAll] = useState(false)

  const installments = useMemo<InstallmentRow[]>(() => {
    const baseDate = new Date(saleDate + 'T12:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const days = parsePaymentCondition(paymentCondition)
    const installmentValue = totalValue / days.length
    const commissionPerInstallment = commissionValue / days.length

    return days.map((dayOffset, i) => {
      const dueDate = addDays(baseDate, dayOffset)
      const dueDateNormalized = new Date(dueDate)
      dueDateNormalized.setHours(0, 0, 0, 0)

      return {
        number: i + 1,
        dueDate,
        value: installmentValue,
        commission: commissionPerInstallment,
        isPast: dueDateNormalized < today,
      }
    })
  }, [saleDate, paymentCondition, totalValue, commissionValue])

  const upcomingInstallments = useMemo(() => {
    return installments.filter(i => !i.isPast)
  }, [installments])

  const pastInstallments = useMemo(() => {
    return installments.filter(i => i.isPast)
  }, [installments])

  const displayInstallments = showAll 
    ? upcomingInstallments 
    : upcomingInstallments.slice(0, 12)
  const hasMore = upcomingInstallments.length > 12

  const isVista = paymentCondition === null || paymentCondition.trim() === ''

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recebimentos</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {formatPaymentCondition(paymentCondition)}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isVista ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50 border-l-2 border-primary">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-primary font-medium w-6">
                    1ª
                  </span>
                  <span className="text-sm font-medium">
                    {formatDate(new Date(saleDate + 'T12:00:00'))}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-semibold text-green-600">
                    {formatCurrency(commissionValue)}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {formatCurrency(totalValue)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {upcomingInstallments.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum vencimento pendente
                  </p>
                )}

                {displayInstallments.length > 0 && (
                  <div className="space-y-2">
                    {displayInstallments.map((inst, index) => {
                      const isNext = index === 0
                      return (
                        <div
                          key={inst.number}
                          className={cn(
                            'flex items-center justify-between py-2 px-3 rounded-md bg-muted/50',
                            isNext && 'border-l-2 border-primary'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              'text-xs w-6',
                              isNext ? 'text-primary font-medium' : 'text-muted-foreground'
                            )}>
                              {inst.number}ª
                            </span>
                            <span className={cn('text-sm', isNext && 'font-medium')}>
                              {formatDate(inst.dueDate)}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              'text-sm font-mono',
                              isNext ? 'font-semibold text-green-600' : 'font-medium text-green-600'
                            )}>
                              {formatCurrency(inst.commission)}
                            </p>
                            <p className={cn(
                              'text-xs font-mono',
                              isNext ? 'text-muted-foreground' : 'text-muted-foreground'
                            )}>
                              {formatCurrency(inst.value)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {upcomingInstallments.length === 0 && pastInstallments.length > 0 && (
                  <p className="text-sm text-muted-foreground py-2">
                    Todas as {installments.length} parcelas já venceram
                  </p>
                )}
              </div>

              {/* Parcelas vencidas (se houver e mostrar todas) */}
              {showAll && pastInstallments.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground">
                    Vencidas ({pastInstallments.length})
                  </p>
                  <div className="space-y-2">
                    {pastInstallments.map((inst) => (
                      <div
                        key={inst.number}
                        className={cn(
                          'flex items-center justify-between py-2 px-3 rounded-md',
                          'bg-muted/30 opacity-60'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Check className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground w-6">
                            {inst.number}ª
                          </span>
                          <span className="text-sm">{formatDate(inst.dueDate)}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono text-green-600">
                            {formatCurrency(inst.commission)}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {formatCurrency(inst.value)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasMore && (
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                  onClick={() => setShowAll(!showAll)}
                >
                  <span>
                    {showAll 
                      ? `Ocultar (mostrando ${upcomingInstallments.length} parcelas)`
                      : `Ver todas as ${installments.length} parcelas`
                    }
                  </span>
                  {showAll ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}

