'use client'

import { cn } from '@/lib/utils'
import type { ReceivableRow } from '@/app/actions/receivables'

type Props = {
  receivable: ReceivableRow
  today: string
  isSelected: boolean
  onToggleSelection: (key: string) => void
  formatCurrency: (value: number) => string
  formatDate: (dateStr: string) => string
  formatMonthShort: (dateStr: string) => string
}

export function ReceivableCard({
  receivable,
  today,
  isSelected,
  onToggleSelection,
  formatCurrency,
  formatDate,
  formatMonthShort,
}: Props) {
  const isOverdue = receivable.status === 'overdue'
  const isToday = receivable.due_date === today
  const key = `${receivable.personal_sale_id}-${receivable.installment_number}`

  return (
    <article
      onClick={() => onToggleSelection(key)}
      className={cn(
        'rounded-xl border bg-card p-3 transition-all cursor-pointer active:scale-[0.98]',
        isSelected && 'border-l-[3px] border-l-[#409eff] bg-primary/5',
        isOverdue && !isSelected && 'border-l-[3px] border-l-destructive',
        isToday && !isSelected && !isOverdue && 'border-l-[3px] border-l-amber-500',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex-1 min-w-0">
          {/* Row 1: Date (left) + Status badge (right) */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-muted text-muted-foreground">
              <span className="font-black">{formatDate(receivable.due_date).split('/')[0]}</span>
              <span className="uppercase text-[10px]">{formatMonthShort(receivable.due_date)}</span>
            </span>
            {isOverdue && (
              <span className="text-[10px] font-semibold text-destructive">ATRASADO</span>
            )}
            {isToday && !isOverdue && (
              <span className="text-[10px] font-semibold text-amber-600">HOJE</span>
            )}
          </div>

          {/* Row 2: Client/Supplier (left) + Value (right) */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <h4 className="font-semibold text-sm truncate leading-tight">
                {receivable.client_name || 'Cliente Final'}
              </h4>
              <span className="text-xs text-muted-foreground truncate block">
                {receivable.supplier_name || 'Direto'}
              </span>
            </div>
            <span className="text-base font-bold tabular-nums shrink-0 text-foreground">
              {formatCurrency(receivable.expected_commission || 0)}
            </span>
          </div>

          {/* Row 3: Installment + Progress bar together */}
          {receivable.total_installments > 1 && (
            <div className="flex flex-col items-center gap-0.5 mt-0.5">
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {receivable.installment_number} de {receivable.total_installments}
              </span>
              <div className="h-1 w-full rounded-full bg-muted/60 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isOverdue ? 'bg-destructive' : 'bg-[#409eff]'
                  )}
                  style={{
                    width: `${(receivable.installment_number / receivable.total_installments) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
