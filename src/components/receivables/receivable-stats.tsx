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
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
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
  )
}
