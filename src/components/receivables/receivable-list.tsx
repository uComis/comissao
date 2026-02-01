'use client'

import { useMemo } from 'react'
import { ReceivableCard } from './receivable-card'
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

export function ReceivableList({
  receivables,
  today,
  isEditMode,
  selectedIds,
  onToggleSelection,
  formatCurrency,
  formatDate,
  formatMonthShort,
}: Props) {
  const groupedByMonth = useMemo(() => {
    const groups: { month: string; items: ReceivableRow[]; total: number }[] = []
    const map = new Map<string, ReceivableRow[]>()

    for (const r of receivables) {
      const monthKey = getMonthYear(r.due_date)
      if (!map.has(monthKey)) map.set(monthKey, [])
      map.get(monthKey)!.push(r)
    }

    for (const [month, items] of map) {
      const total = items.reduce((acc, curr) => acc + (curr.expected_commission || 0), 0)
      groups.push({ month, items, total })
    }

    return groups
  }, [receivables])

  if (groupedByMonth.length === 0) return null

  return (
    <div className="md:hidden space-y-1">
      {groupedByMonth.map(({ month, items, total }) => {
        const overdueCount = items.filter((item) => item.status === 'overdue').length

        return (
          <div key={month}>
            {/* Month separator - WhatsApp style */}
            <div className="flex items-center justify-between px-1 pt-4 pb-2">
              <span className="text-xs font-medium text-muted-foreground capitalize">{month}</span>
              <div className="flex items-center gap-2">
                {overdueCount > 0 && (
                  <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
                    {overdueCount} {overdueCount === 1 ? 'atrasada' : 'atrasadas'}
                  </span>
                )}
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {items.map((receivable) => {
                const key = `${receivable.personal_sale_id}-${receivable.installment_number}`
                return (
                  <ReceivableCard
                    key={key}
                    receivable={receivable}
                    today={today}
                    isEditMode={isEditMode}
                    isSelected={selectedIds.includes(key)}
                    onToggleSelection={onToggleSelection}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    formatMonthShort={formatMonthShort}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
