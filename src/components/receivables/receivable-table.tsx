'use client'

import { useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { ReceivableRow } from '@/app/actions/receivables'

type Props = {
  receivables: ReceivableRow[]
  today: string
  isEditMode: boolean
  selectedIds: string[]
  onToggleSelection: (key: string) => void
  formatCurrency: (value: number) => string
  formatDate: (dateStr: string) => string
  formatMonthShort: (dateStr: string) => string
}

function getMonthYear(dateStr: string): string {
  const finalStr = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`
  const date = new Date(finalStr)
  if (isNaN(date.getTime())) return 'Mês Inválido'
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
}

type TableRow =
  | { type: 'month'; month: string; count: number; total: number; overdueCount: number }
  | { type: 'item'; receivable: ReceivableRow }

export function ReceivableTable({
  receivables,
  today,
  isEditMode,
  selectedIds,
  onToggleSelection,
  formatCurrency,
  formatDate,
  formatMonthShort,
}: Props) {
  const rows = useMemo(() => {
    const result: TableRow[] = []
    let currentMonth = ''

    // Group and create interleaved rows
    const groups = new Map<string, ReceivableRow[]>()
    for (const r of receivables) {
      const monthKey = getMonthYear(r.due_date)
      if (!groups.has(monthKey)) groups.set(monthKey, [])
      groups.get(monthKey)!.push(r)
    }

    for (const [month, items] of groups) {
      const total = items.reduce((acc, curr) => acc + (curr.expected_commission || 0), 0)
      const overdueCount = items.filter((item) => item.status === 'overdue').length
      result.push({ type: 'month', month, count: items.length, total, overdueCount })
      for (const receivable of items) {
        result.push({ type: 'item', receivable })
      }
    }

    return result
  }, [receivables])

  if (rows.length === 0) return null

  return (
    <div className="hidden md:block rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/30">
            {isEditMode && <th className="w-11 px-3 py-3" />}
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
              Vencimento
            </th>
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
              Cliente / Fornecedor
            </th>
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
              Parcela
            </th>
            <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
              Comissão
            </th>
            <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-20">
              Venda
            </th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            let itemIndex = 0
            return rows.map((row, idx) => {
            if (row.type === 'month') {
              return (
                <tr key={`month-${row.month}`} className="bg-transparent">
                  <td colSpan={isEditMode ? 6 : 5} className="px-4 pt-5 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground capitalize">
                        {row.month}
                      </span>
                      <div className="flex items-center gap-2">
                        {row.overdueCount > 0 && (
                          <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
                            {row.overdueCount} {row.overdueCount === 1 ? 'atrasada' : 'atrasadas'}
                          </span>
                        )}
                        <span className="text-sm font-medium text-foreground tabular-nums">
                          {formatCurrency(row.total)}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            }

            const r = row.receivable
            const isOverdue = r.status === 'overdue'
            const isToday = r.due_date === today
            const key = `${r.personal_sale_id}-${r.installment_number}`
            const isSelected = selectedIds.includes(key)
            const progress = (r.installment_number / r.total_installments) * 100
            const isEven = itemIndex % 2 === 0
            itemIndex++

            return (
              <tr
                key={key}
                onClick={() => isEditMode && onToggleSelection(key)}
                className={cn(
                  'border-b border-border/50 transition-colors',
                  isEditMode && 'cursor-pointer',
                  isSelected && 'bg-primary/5',
                  isOverdue && !isSelected && 'bg-destructive/5',
                  isToday && !isSelected && !isOverdue && 'bg-amber-500/5',
                  !isSelected && !isOverdue && !isToday && isEven && 'bg-muted/30',
                  !isSelected && !isOverdue && !isToday && 'hover:bg-muted/80'
                )}
              >
                {isEditMode && (
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelection(key)}
                      className="h-5 w-5 border-2"
                    />
                  </td>
                )}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isOverdue && 'text-destructive',
                        isToday && !isOverdue && 'text-amber-600'
                      )}
                    >
                      {formatDate(r.due_date).split('/')[0]} {formatMonthShort(r.due_date)}
                    </span>
                    {isOverdue && (
                      <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full uppercase">
                        Atrasado
                      </span>
                    )}
                    {isToday && !isOverdue && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full uppercase">
                        Hoje
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 min-w-[200px]">
                  <div className="font-medium text-sm truncate">
                    {r.client_name || 'Cliente Final'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.supplier_name || 'Direto'}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {r.installment_number}/{r.total_installments}
                    </span>
                    <div className="w-14 h-1 rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          isOverdue ? 'bg-destructive' : 'bg-[#409eff]'
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <span
                    className={cn(
                      'text-sm font-bold tabular-nums',
                      isOverdue ? 'text-destructive' : 'text-foreground'
                    )}
                  >
                    {formatCurrency(r.expected_commission || 0)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {r.sale_number && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      #{r.sale_number}
                    </span>
                  )}
                </td>
              </tr>
            )
          })
          })()}
        </tbody>
      </table>
    </div>
  )
}
