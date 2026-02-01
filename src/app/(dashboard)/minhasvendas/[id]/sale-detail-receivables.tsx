'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type Installment = {
  number: number
  dueDate: string
  value: number
  commission: number
  isPast: boolean
}

type Props = {
  installments: Installment[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr))
}

export function SaleDetailReceivables({ installments }: Props) {
  const [showAll, setShowAll] = useState(false)

  const display = showAll ? installments : installments.slice(0, 12)
  const hasMore = installments.length > 12

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recebimentos</p>

      <div className="space-y-2">
        {display.map((inst, index) => {
          const isNext = !inst.isPast && (index === 0 || installments.slice(0, index).every(i => i.isPast))
          return (
            <div
              key={inst.number}
              className={cn(
                'flex items-center justify-between py-2 px-3 rounded-md bg-muted/50',
                isNext && 'border-l-2 border-primary',
                inst.isPast && 'opacity-60'
              )}
            >
              <div className="flex items-center gap-3">
                {inst.isPast ? (
                  <Check className="h-3 w-3 text-green-600 shrink-0" />
                ) : (
                  <span className={cn(
                    'text-xs w-4 shrink-0',
                    isNext ? 'text-primary font-medium' : 'text-muted-foreground'
                  )}>
                    {inst.number}ª
                  </span>
                )}
                <span className={cn('text-sm', isNext && 'font-medium')}>
                  {formatDate(inst.dueDate)}
                </span>
              </div>
              <div className="text-right">
                <p className={cn(
                  'text-sm text-green-600',
                  isNext ? 'font-semibold' : 'font-medium'
                )}>
                  {formatCurrency(inst.commission)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(inst.value)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {hasMore && (
        <Button
          variant="ghost"
          className="w-full justify-between mt-2"
          onClick={() => setShowAll(!showAll)}
        >
          <span>
            {showAll
              ? 'Ocultar parcelas'
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
    </div>
  )
}
