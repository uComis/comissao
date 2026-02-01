'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReceivableRow } from '@/app/actions/receivables'

type Props = {
  receivables: ReceivableRow[]
  onUndo: (receivable: ReceivableRow) => void
  loading: boolean
  formatCurrency: (value: number) => string
  formatDate: (dateStr: string) => string
}

export function ReceivedSection({ receivables, onUndo, loading, formatCurrency, formatDate }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  if (receivables.length === 0) return null

  return (
    <div className="pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 border-b border-border transition-colors hover:bg-muted/30 rounded-t-lg px-3"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-muted-foreground">Recebidos</span>
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
            {receivables.length}
          </Badge>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="space-y-2 pt-3">
          {receivables.map((receivable) => {
            const key = `${receivable.personal_sale_id}-${receivable.installment_number}`
            return (
              <div
                key={key}
                className="rounded-xl border border-green-200/50 dark:border-green-900/30 bg-green-50/30 dark:bg-green-950/10 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Dates */}
                    <div className="flex flex-col gap-0.5 mb-1.5">
                      <span className="text-xs text-muted-foreground line-through">
                        Vencia: {formatDate(receivable.due_date)}
                      </span>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Recebido: {receivable.received_at ? formatDate(receivable.received_at) : '-'}
                      </span>
                    </div>
                    {/* Client */}
                    <div className="text-sm font-medium truncate text-muted-foreground line-through">
                      {receivable.client_name || 'Cliente Final'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {receivable.supplier_name || 'Direto'}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 shrink-0">
                    <span className="text-base font-bold text-green-700 dark:text-green-400 tabular-nums">
                      {formatCurrency(receivable.received_amount || receivable.expected_commission || 0)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onUndo(receivable)}
                      disabled={loading}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
