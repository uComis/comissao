'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ReceivableRow } from '@/app/actions/receivables'

type Props = {
  receivables: ReceivableRow[]
  today: string
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

type MonthGroup = {
  month: string
  items: ReceivableRow[]
  total: number
  overdueCount: number
}

export function ReceivableTable({
  receivables,
  today,
  selectedIds,
  onToggleSelection,
  formatCurrency,
  formatDate,
  formatMonthShort,
}: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, ReceivableRow[]>()
    for (const r of receivables) {
      const key = getMonthYear(r.due_date)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }

    const result: MonthGroup[] = []
    for (const [month, items] of map) {
      const total = items.reduce((acc, curr) => acc + (curr.expected_commission || 0), 0)
      const overdueCount = items.filter((item) => item.status === 'overdue').length
      result.push({ month, items, total, overdueCount })
    }
    return result
  }, [receivables])

  if (groups.length === 0) return null

  return (
    <div className="hidden md:block space-y-4">
      {groups.map((group) => (
        <Card key={group.month} className="overflow-hidden py-0 gap-0">
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm font-semibold capitalize text-foreground">{group.month}</span>
            <div className="flex items-center gap-2">
              {group.overdueCount > 0 && (
                <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
                  {group.overdueCount} {group.overdueCount === 1 ? 'atrasada' : 'atrasadas'}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {group.items.length} {group.items.length === 1 ? 'parcela' : 'parcelas'}
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {formatCurrency(group.total)}
              </span>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-y bg-muted/50">
                <th className="text-left text-xs font-medium text-foreground/70 px-4 py-2">
                  Vencimento
                </th>
                <th className="text-left text-xs font-medium text-foreground/70 px-4 py-2">
                  Cliente / Fornecedor
                </th>
                <th className="text-center text-xs font-medium text-foreground/70 px-4 py-2">
                  Parcela(s)
                </th>
                <th className="text-right text-xs font-medium text-foreground/70 px-4 py-2">
                  Comissão
                </th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((r, itemIndex) => {
                const isOverdue = r.status === 'overdue'
                const isToday = r.due_date === today
                const key = `${r.personal_sale_id}-${r.installment_number}`
                const isSelected = selectedIds.includes(key)
                const progress = (r.installment_number / r.total_installments) * 100
                const isEven = itemIndex % 2 === 0
                const isLast = itemIndex === group.items.length - 1

                return (
                  <tr
                    key={key}
                    onClick={() => onToggleSelection(key)}
                    className={cn(
                      'transition-colors cursor-pointer',
                      !isLast && 'border-b border-border/50',
                      isSelected && 'bg-primary/10',
                      isOverdue && !isSelected && 'bg-destructive/5',
                      isToday && !isSelected && !isOverdue && 'bg-amber-500/5',
                      !isSelected && !isOverdue && !isToday && isEven && 'bg-muted/30',
                      !isSelected && !isOverdue && !isToday && 'hover:bg-muted/80'
                    )}
                  >
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  )
}
