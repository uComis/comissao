'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOrganization } from '@/contexts/organization-context'
import { getSalesWithSellers, forceSyncSales } from '@/app/actions/sales'
import { calculateCommissionsForPeriod, getTotalCommissionsByPeriod } from '@/app/actions/commissions'
import { SalesTable } from '@/components/sales'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, ShoppingCart, DollarSign, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import type { SaleWithSeller } from '@/types'

// Gera lista de períodos (últimos 12 meses)
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Período atual
function getCurrentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function VendasPage() {
  const { organization, loading: orgLoading } = useOrganization()
  const [sales, setSales] = useState<SaleWithSeller[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [period, setPeriod] = useState(getCurrentPeriod())
  const [totalCommission, setTotalCommission] = useState(0)

  const periods = generatePeriods()

  const loadSales = useCallback(async () => {
    if (!organization) return
    setLoading(true)
    try {
      const data = await getSalesWithSellers(organization.id)
      console.log('[vendas] fetched sales', { total: data.length, period })
      // Filtra pelo período selecionado
      const filtered = data.filter((sale) => {
        const salePeriod = sale.sale_date.substring(0, 7)
        return salePeriod === period
      })
      console.log('[vendas] filtered sales', {
        afterFilter: filtered.length,
        sample: filtered.slice(0, 3).map((s) => ({
          id: s.id,
          date: s.sale_date,
          seller: s.seller?.name,
        })),
      })
      setSales(filtered)

      // Carrega total de comissões do período
      const total = await getTotalCommissionsByPeriod(organization.id, period)
      setTotalCommission(total)
    } finally {
      setLoading(false)
    }
  }, [organization, period])

  useEffect(() => {
    loadSales()
  }, [loadSales])

  async function handleSync() {
    if (!organization) return
    setSyncing(true)
    try {
      const result = await forceSyncSales(organization.id)
      if (result.success) {
        const { synced, skipped } = result.data
        if (synced > 0) {
          toast.success(`${synced} vendas sincronizadas`)
        } else if (skipped > 0) {
          toast.info('Vendas já sincronizadas')
        } else {
          toast.info('Nenhuma venda nova encontrada')
        }
        await loadSales()
      } else {
        toast.error(result.error)
      }
    } finally {
      setSyncing(false)
    }
  }

  async function handleCalculate() {
    if (!organization) return
    setCalculating(true)
    try {
      const result = await calculateCommissionsForPeriod(organization.id, period)
      if (result.success) {
        const { calculated, totalAmount } = result.data
        if (calculated > 0) {
          toast.success(`${calculated} comissões calculadas: ${formatCurrency(totalAmount)}`)
        } else {
          toast.info('Nenhuma comissão para calcular')
        }
        setTotalCommission(totalAmount)
      } else {
        toast.error(result.error)
      }
    } finally {
      setCalculating(false)
    }
  }

  if (orgLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
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

  const totalGross = sales.reduce((sum, s) => sum + Number(s.gross_value), 0)
  const totalNet = sales.reduce((sum, s) => sum + Number(s.net_value), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>
          <p className="text-muted-foreground">
            Vendas importadas do CRM
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
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
          <Button onClick={handleCalculate} disabled={calculating || sales.length === 0}>
            <Calculator className={`mr-2 h-4 w-4 ${calculating ? 'animate-pulse' : ''}`} />
            {calculating ? 'Calculando...' : 'Calcular Comissões'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bruto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalGross)}</div>
            <p className="text-xs text-muted-foreground">valor original</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalNet)}</div>
            <p className="text-xs text-muted-foreground">após deduções</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCommission)}</div>
            <p className="text-xs text-muted-foreground">a pagar</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendas</CardTitle>
          <CardDescription>
            Vendas do período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <SalesTable sales={sales} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

