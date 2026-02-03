'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOrganization } from '@/contexts/app-data-context'
import { forceSyncSales, deleteSales, getSalesPeriods } from '@/app/actions/sales'
import { getSalesWithCommissionsPaginated, getPeriodTotals, closePeriod, reverseCommissions } from '@/app/actions/commissions'
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
import {
  RefreshCw,
  Lock,
  RotateCcw,
  X,
  MoreVertical,
  ShoppingCart,
  DollarSign,
  Calculator,
  Trash2,
} from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { toast } from 'sonner'
import { usePreferences } from '@/hooks/use-preferences'
import { useHeaderActions } from '@/components/layout'
import type { SaleWithCommission } from '@/types'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export default function VendasPage() {
  const { organization, loading: orgLoading } = useOrganization()
  const { preferences, setPreference } = usePreferences()
  const [sales, setSales] = useState<SaleWithCommission[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [closing, setClosing] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [periods, setPeriods] = useState<{ value: string; label: string }[]>([])
  const [period, setPeriod] = useState<string>('')

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = preferences.salesPageSize
  const setPageSize = (size: number) => setPreference('salesPageSize', size)
  const [totalItems, setTotalItems] = useState(0)

  // Totais do período (para cards)
  const [totals, setTotals] = useState({
    count: 0,
    gross: 0,
    net: 0,
    commission: 0,
    openCount: 0,
    closedCount: 0,
  })

  // Estado para modo de seleção (estorno ou delete)
  type SelectionType = 'reverse' | 'delete' | null
  const [selectionType, setSelectionType] = useState<SelectionType>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [reversing, setReversing] = useState(false)
  const [showReverseDialog, setShowReverseDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Carrega períodos disponíveis
  const loadPeriods = useCallback(async () => {
    if (!organization) return
    const availablePeriods = await getSalesPeriods(organization.id)
    setPeriods(availablePeriods)
    // Seleciona o primeiro período (mais recente) se ainda não tiver selecionado
    if (availablePeriods.length > 0 && !period) {
      setPeriod(availablePeriods[0].value)
    }
  }, [organization, period])

  useEffect(() => {
    loadPeriods()
  }, [loadPeriods])

  const loadSales = useCallback(async () => {
    if (!organization) return
    // Se não há período, para o loading
    if (!period) {
      setLoading(false)
      setSales([])
      setTotalItems(0)
      return
    }
    setLoading(true)
    try {
      // Busca vendas paginadas
      const { data, total } = await getSalesWithCommissionsPaginated(
        organization.id,
        period,
        currentPage,
        pageSize
      )
      setSales(data)
      setTotalItems(total)
      // Limpa seleção ao recarregar
      setSelectedIds(new Set())
      setSelectionType(null)
    } finally {
      setLoading(false)
    }
  }, [organization, period, currentPage, pageSize])

  // Carrega totais do período (para cards de resumo)
  const loadTotals = useCallback(async () => {
    if (!organization || !period) {
      setTotals({ count: 0, gross: 0, net: 0, commission: 0, openCount: 0, closedCount: 0 })
      return
    }
    const data = await getPeriodTotals(organization.id, period)
    setTotals(data)
  }, [organization, period])

  useEffect(() => {
    loadTotals()
  }, [loadTotals])

  useEffect(() => {
    loadSales()
  }, [loadSales])

  // Cálculo de paginação
  const totalPages = Math.ceil(totalItems / pageSize)

  // Reseta para página 1 quando muda período ou pageSize
  useEffect(() => {
    setCurrentPage(1)
  }, [period, pageSize])

  // Gera números de página para exibir
  function getPageNumbers(): (number | 'ellipsis')[] {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      
      if (currentPage > 3) pages.push('ellipsis')
      
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) pages.push(i)
      
      if (currentPage < totalPages - 2) pages.push('ellipsis')
      
      pages.push(totalPages)
    }
    return pages
  }

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
        // Recarrega períodos, totais e vendas
        await loadPeriods()
        await loadTotals()
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
        await loadTotals()
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
        await loadTotals()
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
    setSelectionType(null)
    setSelectedIds(new Set())
  }

  async function handleDelete() {
    if (selectedIds.size === 0) return
    setDeleting(true)
    try {
      const result = await deleteSales(Array.from(selectedIds))
      if (result.success) {
        toast.success(`${result.data.deleted} venda(s) excluída(s)`)
        await loadTotals()
        await loadSales()
      } else {
        toast.error(result.error)
      }
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  useHeaderActions(
    <>
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
        disabled={closing || totals.openCount === 0 || selectionType !== null}
      >
        <Lock className={`mr-2 h-4 w-4 ${closing ? 'animate-pulse' : ''}`} />
        {closing ? 'Fechando...' : 'Fechar Período'}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" disabled={selectionType !== null}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar vendas'}
          </DropdownMenuItem>
          {totals.closedCount > 0 && (
            <DropdownMenuItem onClick={() => setSelectionType('reverse')}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Estornar comissões
            </DropdownMenuItem>
          )}
          {sales.length > 0 && (
            <DropdownMenuItem onClick={() => setSelectionType('delete')}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir vendas
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )

  if (orgLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!organization) {
    return <div className="text-muted-foreground text-center py-8">Organização não encontrada</div>
  }

  return (
    <div className="space-y-6 animate-page-in">

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
                  {totals.openCount} aberta(s), {totals.closedCount} fechada(s)
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
                {selectionType === 'reverse' && 'Selecione as comissões para estornar'}
                {selectionType === 'delete' && 'Selecione as vendas para excluir'}
                {!selectionType && 'Vendas do período selecionado'}
              </CardDescription>
            </div>
            {selectionType === 'reverse' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selecionada(s)
                </span>
                <Button variant="outline" size="sm" onClick={handleCancelSelection}>
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
            {selectionType === 'delete' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selecionada(s)
                </span>
                <Button variant="outline" size="sm" onClick={handleCancelSelection}>
                  <X className="mr-1 h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={selectedIds.size === 0 || deleting}
                >
                  <Trash2 className={`mr-1 h-4 w-4 ${deleting ? 'animate-pulse' : ''}`} />
                  {deleting ? 'Excluindo...' : 'Confirmar Exclusão'}
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
              selectionMode={selectionType !== null}
              selectionType={selectionType || 'reverse'}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Itens por página:</span>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="w-[80px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground ml-2">
                  {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} de {totalItems}
                </span>
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {getPageNumbers().map((page, idx) =>
                    page === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar Período</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá travar as comissões de {totals.openCount} venda(s) aberta(s). Após o
              fechamento, os valores não poderão ser alterados automaticamente por mudanças em
              regras ou taxas.
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
              Esta ação irá estornar {selectedIds.size} comissão(ões) fechada(s). As vendas voltarão
              a calcular comissão automaticamente com base nas regras e taxas atuais.
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Vendas</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá excluir permanentemente {selectedIds.size} venda(s) e suas comissões
              associadas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
