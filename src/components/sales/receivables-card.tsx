'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Check, ChevronRight } from 'lucide-react'
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

export function ReceivablesCard({
  saleDate,
  paymentCondition,
  totalValue,
  commissionValue,
  commissionRate,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)

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

  const displayInstallments = upcomingInstallments.slice(0, 3)
  const hasMore = installments.length > 3

  const isVista = paymentCondition === null || paymentCondition.trim() === ''

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recebimentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isVista ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Pagamento à vista</p>
              <div className="flex justify-between items-center py-2 px-3 rounded-md bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Valor: {formatCurrency(totalValue)}</p>
                  <p className="text-xs text-muted-foreground">
                    Comissão: {formatCurrency(commissionValue)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {upcomingInstallments.length > 0
                    ? 'Próximos vencimentos:'
                    : 'Nenhum vencimento pendente'}
                </p>

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
                              isNext ? 'font-semibold' : 'font-medium'
                            )}>
                              {formatCurrency(inst.value)}
                            </p>
                            <p className={cn(
                              'text-xs font-mono',
                              isNext ? 'text-primary' : 'text-muted-foreground'
                            )}>
                              {formatCurrency(inst.commission)}
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

              {hasMore && (
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                  onClick={() => setSheetOpen(true)}
                >
                  <span>Ver todas as {installments.length} parcelas</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg p-6">
          <SheetHeader className="mb-4">
            <SheetTitle>Todas as Parcelas</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Vencidas */}
            {pastInstallments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Vencidas ({pastInstallments.length})
                </p>
                <div className="space-y-1">
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
                        <p className="text-sm font-mono">{formatCurrency(inst.value)}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {formatCurrency(inst.commission)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Próximas */}
            {upcomingInstallments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Próximas ({upcomingInstallments.length})
                </p>
                <div className="space-y-1">
                  {upcomingInstallments.map((inst, index) => {
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
                            isNext ? 'font-semibold' : 'font-medium'
                          )}>
                            {formatCurrency(inst.value)}
                          </p>
                          <p className={cn(
                            'text-xs font-mono',
                            isNext ? 'text-primary' : 'text-muted-foreground'
                          )}>
                            {formatCurrency(inst.commission)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Totais */}
          <div className="mt-6 pt-4 border-t space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="font-mono font-semibold">{formatCurrency(totalValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Comissão total ({commissionRate.toFixed(2)}%):
              </span>
              <span className="font-mono font-semibold text-green-600">
                {formatCurrency(commissionValue)}
              </span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

