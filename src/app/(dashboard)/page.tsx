'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOrganization } from '@/contexts/organization-context'
import { getDashboardSummary, getDashboardHistory } from '@/app/actions/commissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  EvolutionChart,
  CommissionPieChart,
  SellerPerformanceChart,
} from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import type { DashboardSummary, DashboardHistory } from '@/types'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function getCurrentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function generatePeriods(): { value: string; label: string }[] {
  const periods = []
  const now = new Date()

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
    periods.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }

  return periods
}

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default function DashboardPage() {
  const { organization, loading: orgLoading } = useOrganization()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [history, setHistory] = useState<DashboardHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [period, setPeriod] = useState(getCurrentPeriod())

  const periods = generatePeriods()

  const loadSummary = useCallback(async () => {
    if (!organization) return
    setLoading(true)
    try {
      const data = await getDashboardSummary(organization.id, period)
      setSummary(data)
    } finally {
      setLoading(false)
    }
  }, [organization, period])

  const loadHistory = useCallback(async () => {
    if (!organization) return
    setHistoryLoading(true)
    try {
      const data = await getDashboardHistory(organization.id, 6)
      setHistory(data)
    } finally {
      setHistoryLoading(false)
    }
  }, [organization])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  if (orgLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Organização não encontrada
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumo de {formatPeriodLabel(period)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => window.open(`/impressao/dashboard?mes=${period}`, '_blank')}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Gráfico de evolução multi-série */}
      <EvolutionChart data={history?.periods ?? []} loading={historyLoading} />

      {/* Gráficos lado a lado: Pizza + Performance por vendedor */}
      <div className="grid gap-4 md:grid-cols-2">
        <CommissionPieChart data={summary?.sellers ?? []} loading={loading} />
        <SellerPerformanceChart
          data={history?.sellers ?? []}
          periods={history?.periods.map((p) => p.period) ?? []}
          loading={historyLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendedores</CardTitle>
          <CardDescription>Resumo de comissões por vendedor no período</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : summary?.sellers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma venda no período
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Total Bruto</TableHead>
                  <TableHead className="text-right">Total Líquido</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary?.sellers.map((seller) => (
                  <TableRow key={seller.seller_id}>
                    <TableCell className="font-medium">{seller.seller_name}</TableCell>
                    <TableCell className="text-right">{seller.sales_count}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(seller.total_gross_value)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(seller.total_net_value)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(seller.total_commission)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
