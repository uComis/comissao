'use client'

import { StatCard } from '@/components/dashboard/stat-card'
import { DollarSign, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { ReceivablesStats } from '@/app/actions/receivables'

type FilterStatus = 'all' | 'pending' | 'overdue' | 'received'

type Props = {
  stats: ReceivablesStats
  filterStatus: FilterStatus
  onFilterChange: (status: FilterStatus) => void
  formatCurrency: (value: number) => string
}

export function ReceivableStats({ stats, filterStatus, onFilterChange, formatCurrency }: Props) {
  const totalAll = stats.totalPending + stats.totalOverdue + stats.totalReceived
  const countAll = stats.countPending + stats.countOverdue + stats.countReceived

  return (
    <div className="relative">
      {/* Mobile: horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 snap-x snap-mandatory md:hidden scrollbar-hide">
        <div className="shrink-0 w-4" aria-hidden="true" />
        <div className="snap-start shrink-0 w-[calc(50%-4px)] min-w-[140px]">
          <StatCard
            label="Total Projetado"
            value={formatCurrency(totalAll)}
            icon={DollarSign}
            subtitle={`${countAll} parcelas`}
            onClick={() => onFilterChange('all')}
            active={filterStatus === 'all'}
          />
        </div>
        <div className="snap-start shrink-0 w-[calc(50%-4px)] min-w-[140px]">
          <StatCard
            label="A Receber"
            value={formatCurrency(stats.totalPending)}
            icon={Clock}
            subtitle={`${stats.countPending} parcelas`}
            onClick={() => onFilterChange('pending')}
            active={filterStatus === 'pending'}
          />
        </div>
        <div className="snap-start shrink-0 w-[calc(50%-4px)] min-w-[140px]">
          <StatCard
            label="Atrasados"
            value={formatCurrency(stats.totalOverdue)}
            icon={AlertTriangle}
            subtitle={`${stats.countOverdue} parcelas`}
            onClick={() => onFilterChange('overdue')}
            active={filterStatus === 'overdue'}
          />
        </div>
        <div className="snap-start shrink-0 w-[calc(50%-4px)] min-w-[140px]">
          <StatCard
            label="Recebidos"
            value={formatCurrency(stats.totalReceived)}
            icon={CheckCircle2}
            subtitle={`${stats.countReceived} parcelas`}
            onClick={() => onFilterChange('received')}
            active={filterStatus === 'received'}
          />
        </div>
        <div className="shrink-0 w-2" aria-hidden="true" />
      </div>

      {/* Desktop: grid 4 columns */}
      <div className="hidden md:grid md:grid-cols-4 gap-4">
        <StatCard
          label="Total Projetado"
          value={formatCurrency(totalAll)}
          icon={DollarSign}
          subtitle={`${countAll} parcelas`}
          onClick={() => onFilterChange('all')}
          active={filterStatus === 'all'}
        />
        <StatCard
          label="A Receber"
          value={formatCurrency(stats.totalPending)}
          icon={Clock}
          subtitle={`${stats.countPending} parcelas`}
          onClick={() => onFilterChange('pending')}
          active={filterStatus === 'pending'}
        />
        <StatCard
          label="Atrasados"
          value={formatCurrency(stats.totalOverdue)}
          icon={AlertTriangle}
          subtitle={`${stats.countOverdue} parcelas`}
          onClick={() => onFilterChange('overdue')}
          active={filterStatus === 'overdue'}
        />
        <StatCard
          label="Recebidos"
          value={formatCurrency(stats.totalReceived)}
          icon={CheckCircle2}
          subtitle={`${stats.countReceived} parcelas`}
          onClick={() => onFilterChange('received')}
          active={filterStatus === 'received'}
        />
      </div>
    </div>
  )
}
