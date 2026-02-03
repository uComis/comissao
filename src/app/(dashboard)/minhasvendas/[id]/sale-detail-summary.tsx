'use client'

import { StatCard } from '@/components/dashboard/stat-card'
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react'

type Props = {
  totalReceived: number
  totalOverdue: number
  totalPending: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function SaleDetailSummary({ totalReceived, totalOverdue, totalPending }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <StatCard
        label="Recebido"
        value={formatCurrency(totalReceived)}
        icon={CheckCircle2}
        valueClassName="text-green-600"
        iconClassName="text-green-600"
      />
      <StatCard
        label="Atrasado"
        value={formatCurrency(totalOverdue)}
        icon={AlertTriangle}
        valueClassName={totalOverdue > 0 ? "text-destructive" : undefined}
        iconClassName={totalOverdue > 0 ? "text-destructive" : undefined}
      />
      <StatCard
        label="A Receber"
        value={formatCurrency(totalPending)}
        icon={Clock}
        valueClassName="text-[#409eff]"
        iconClassName="text-[#409eff]"
      />
    </div>
  )
}
