'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOrganization } from '@/contexts/organization-context'
import { forceSyncSales } from '@/app/actions/sales'
import { getSalesWithCommissions, closePeriod, reverseCommissions } from '@/app/actions/commissions'
import { SalesTable } from '@/components/sales'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RefreshCw, Lock, RotateCcw, X, MoreVertical, ShoppingCart, DollarSign, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import type { SaleWithCommission } from '@/types'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

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

// Período atual
function getCurrentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function VendasPage() {
  const { organization, loading: orgLoading } = useOrganization()
  const [sales, setSales] = useState<SaleWithCommission[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [closing, setClosing] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [period, setPeriod] = useState(getCurrentPeriod())
  
  // Estado para modo de seleção (estorno)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [reversing, setReversing] = useState(false)
  const [showReverseDialog, setShowReverseDialog] = useState(false)

  const periods = generatePeriods()

  const loadSales = useCallback(async () => {
    if (!organization) return
    setLoading(true)
    try {
      // Usa função híbrida - já retorna vendas com comissões calculadas
      const data = await getSalesWithCommissions(organization.id, period)
      setSales(data)
      // Limpa seleção ao recarregar
      setSelectedIds(new Set())
      setSelectionMode(false)
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

  async function handleClosePeriod() {
    if (!organization) return
    setClosing(true)
    try {
      const result = await closePeriod(organization.id, period)
      if (result.success) {
        const { calculated } = result.data
        if (calculated > 0) {
          toast.success(`Período fechado: ${calculated} comissões registradas`)
        } else {
          toast.info('Período fechado (sem novas comissões)')
        }
        // Recarrega para atualizar status is_closed
        await loadSales()
      } else {
        toast.error(result.error)
      }
    } finally {
      setClosing(false)
      setShowCloseDialog(false)
    }
  }

  async function handleReverse() {
    if (selectedIds.size === 0) return
    setReversing(true)
    try {
      const result = await reverseCommissions(Array.from(selectedIds))
      if (result.success) {
        toast.success(`${result.data.reversed} comissão(ões) estornada(s)`)
        await loadSales()
      } else {
        toast.error(result.error)
      }
    } finally {
      setReversing(false)
      setShowReverseDialog(false)
    }
  }

  function handleCancelSelection() {
    setSelectionMode(false)
    setSelectedIds(new Set())
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

  const openSalesCount = sales.filter((s) => s.commission && !s.commission.is_closed).length
  const closedSalesCount = sales.filter((s) => s.commission?.is_closed).length

  // Calcular totais do período
  const totals = sales.reduce(
    (acc, sale) => ({
      count: acc.count + 1,
      gross: acc.gross + sale.gross_value,
      net: acc.net + sale.net_value,
      commission: acc.commission + (sale.commission?.amount ?? 0),
    }),
    { count: 0, gross: 0, net: 0, commission: 0 }
  )

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
          <Button
            onClick={() => setShowCloseDialog(true)}
            disabled={closing || openSalesCount === 0 || selectionMode}
          >
            <Lock className={`mr-2 h-4 w-4 ${closing ? 'animate-pulse' : ''}`} />
            {closing ? 'Fechando...' : 'Fechar Período'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={selectionMode}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSync} disabled={syncing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar vendas'}
              </DropdownMenuItem>
              {closedSalesCount > 0 && (
                <DropdownMenuItem onClick={() => setSelectionMode(true)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Estornar comissões
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totals.count}</div>
                <p className="text-xs text-muted-foreground">no período</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bruto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(totals.gross)}</div>
                <p className="text-xs text-muted-foreground">valor original</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(totals.net)}</div>
                <p className="text-xs text-muted-foreground">após deduções</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totals.commission)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {openSalesCount} aberta(s), {closedSalesCount} fechada(s)
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Vendas</CardTitle>
              <CardDescription>
                {selectionMode
                  ? 'Selecione as comissões para estornar'
                  : 'Vendas do período selecionado'}
              </CardDescription>
            </div>
            {selectionMode && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selecionada(s)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelSelection}
                >
                  <X className="mr-1 h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowReverseDialog(true)}
                  disabled={selectedIds.size === 0 || reversing}
                >
                  <RotateCcw className={`mr-1 h-4 w-4 ${reversing ? 'animate-spin' : ''}`} />
                  {reversing ? 'Estornando...' : 'Confirmar Estorno'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <SalesTable
              sales={sales}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar Período</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá travar as comissões de {openSalesCount} venda(s) aberta(s).
              Após o fechamento, os valores não poderão ser alterados automaticamente
              por mudanças em regras ou taxas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClosePeriod} disabled={closing}>
              {closing ? 'Fechando...' : 'Confirmar Fechamento'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showReverseDialog} onOpenChange={setShowReverseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Estornar Comissões</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá estornar {selectedIds.size} comissão(ões) fechada(s).
              As vendas voltarão a calcular comissão automaticamente com base
              nas regras e taxas atuais.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReverse} disabled={reversing}>
              {reversing ? 'Estornando...' : 'Confirmar Estorno'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

