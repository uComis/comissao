'use client'

import { useState, useMemo, useEffect, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { StatCard } from '@/components/dashboard/stat-card'
import { PersonalSaleTable } from '@/components/sales'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { AnimatedTableContainer } from '@/components/ui/animated-table-container'
import { ExpandableSearch } from '@/components/ui/expandable-search'
import { FilterPopover, FilterPopoverField } from '@/components/ui/filter-popover'
import { Fab } from '@/components/ui/fab'
import { ShoppingBag, TrendingUp, Target, DollarSign, Plus, Filter, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getPersonalSalesPaginated, type PaginatedSalesResult } from '@/app/actions/personal-sales'
import type { PersonalSale } from '@/types'

const PAGE_SIZE_DEFAULT = 10

type Supplier = { id: string; name: string }
type Client = { id: string; name: string }

type Props = {
  initialData: PaginatedSalesResult
  suppliers: Supplier[]
  clients: Client[]
}

export function MinhasVendasClient({ initialData, suppliers, clients }: Props) {
  const [isPending, startTransition] = useTransition()

  // Data state
  const [sales, setSales] = useState<PersonalSale[]>(initialData.data)
  const [total, setTotal] = useState(initialData.total)

  // Filter state
  const [search, setSearch] = useState('')
  const [supplierId, setSupplierId] = useState<string>('all')
  const [clientId, setClientId] = useState<string>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT)
  const [mobileVisible, setMobileVisible] = useState(PAGE_SIZE_DEFAULT)

  const selectFilterCount = (supplierId !== 'all' ? 1 : 0) + (clientId !== 'all' ? 1 : 0)
  const drawerFilterCount = selectFilterCount + (search ? 1 : 0)

  // Fetch data from server - atualiza página só quando dados chegam
  const fetchData = useCallback((newPage: number, newPageSize: number, updatePageTo?: number) => {
    startTransition(async () => {
      try {
        const result = await getPersonalSalesPaginated({
          page: newPage,
          pageSize: newPageSize,
          search: search || undefined,
          supplierId: supplierId !== 'all' ? supplierId : undefined,
          clientId: clientId !== 'all' ? clientId : undefined,
        })
        // Atualiza dados E página juntos para sincronizar com a animação
        setSales(result.data)
        setTotal(result.total)
        if (updatePageTo !== undefined) {
          setPage(updatePageTo)
        }
      } catch (error) {
        console.error('Error fetching sales:', error)
      }
    })
  }, [search, supplierId, clientId])

  // Fetch when filters change (reset to page 1)
  useEffect(() => {
    setMobileVisible(PAGE_SIZE_DEFAULT)
    fetchData(1, pageSize, 1)
  }, [search, supplierId, clientId, pageSize, fetchData])

  // Fetch when page changes (desktop) - não atualiza page imediatamente
  const handlePageChange = (newPage: number) => {
    fetchData(newPage, pageSize, newPage)
  }

  // Fetch when page size changes
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    fetchData(1, newPageSize, 1)
  }

  // Load more for mobile
  const handleLoadMore = () => {
    const newVisible = mobileVisible + PAGE_SIZE_DEFAULT
    setMobileVisible(newVisible)

    // If we need more data from server
    if (newVisible > sales.length && sales.length < total) {
      startTransition(async () => {
        try {
          const result = await getPersonalSalesPaginated({
            page: 1,
            pageSize: newVisible,
            search: search || undefined,
            supplierId: supplierId !== 'all' ? supplierId : undefined,
            clientId: clientId !== 'all' ? clientId : undefined,
          })
          setSales(result.data)
          setTotal(result.total)
        } catch (error) {
          console.error('Error fetching more sales:', error)
        }
      })
    }
  }

  // Stats calculadas a partir do total e dos dados visíveis
  const stats = useMemo(() => {
    const faturado = sales.reduce((sum, s) => sum + (s.gross_value || 0), 0)
    const comissao = sales.reduce((sum, s) => sum + (s.commission_value || 0), 0)
    const ticket = sales.length > 0 ? faturado / sales.length : 0
    return { count: total, faturado, comissao, ticket }
  }, [sales, total])

  function clearFilters() {
    setSupplierId('all')
    setClientId('all')
  }

  function clearAllFilters() {
    setSearch('')
    clearFilters()
  }

  const supplierSelect = (
    <Select value={supplierId} onValueChange={setSupplierId}>
      <SelectTrigger className="h-8 text-sm w-full">
        <SelectValue placeholder="Pasta" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas as pastas</SelectItem>
        {suppliers.map((s) => (
          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const clientSelect = (
    <Select value={clientId} onValueChange={setClientId}>
      <SelectTrigger className="h-8 text-sm w-full">
        <SelectValue placeholder="Cliente" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os clientes</SelectItem>
        {clients.map((c) => (
          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  // Mobile: paginated data
  const mobileSales = useMemo(() => {
    return sales.slice(0, mobileVisible)
  }, [sales, mobileVisible])

  const hasMoreMobile = mobileVisible < total

  return (
    <div className="space-y-4">
      {/* FAB Mobile */}
      <Fab href="/minhasvendas/nova" label="Nova Venda" />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <StatCard label="Vendas" value={String(stats.count)} icon={ShoppingBag} subtitle="total" />
        <StatCard label="Faturado" value={formatCurrency(stats.faturado)} icon={TrendingUp} subtitle="página atual" />
        <StatCard label="Comissão" value={formatCurrency(stats.comissao)} icon={Target} valueClassName="text-[#409eff]" subtitle="página atual" />
        <StatCard label="Ticket Médio" value={formatCurrency(stats.ticket)} icon={DollarSign} subtitle="página atual" />
      </div>

      {/* Desktop Filters */}
      <Card className="p-3 hidden md:block">
        <div className="flex items-center gap-2">
          <ExpandableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar cliente..."
          />
          <FilterPopover
            activeCount={selectFilterCount}
            onClear={clearFilters}
          >
            <FilterPopoverField label="Pasta">
              {supplierSelect}
            </FilterPopoverField>
            <FilterPopoverField label="Cliente">
              {clientSelect}
            </FilterPopoverField>
          </FilterPopover>
          <div className="flex-1" />
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/minhasvendas/nova">
              <Plus className="h-4 w-4 mr-1.5" />
              Nova Venda
            </Link>
          </Button>
        </div>
      </Card>

      {/* Mobile/Tablet Filters */}
      <Card className="p-3 md:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 relative"
            onClick={() => setDrawerOpen(true)}
          >
            <Filter className="h-3.5 w-3.5" />
            {drawerFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {drawerFilterCount}
              </span>
            )}
          </Button>
          <div className="flex-1" />
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </Card>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader>
              <DrawerTitle>Filtros</DrawerTitle>
              <DrawerDescription className="sr-only">Filtrar vendas</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Busca</label>
                <ExpandableSearch
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar cliente..."
                  alwaysExpanded
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Pasta</label>
                {supplierSelect}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Cliente</label>
                {clientSelect}
              </div>
              {drawerFilterCount > 0 && (
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={clearAllFilters}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Table / List */}
      {total === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma venda encontrada.
        </div>
      ) : (
        <>
          {/* Desktop: table + pagination */}
          <div className="hidden md:block">
            <AnimatedTableContainer transitionKey={page} minHeight={pageSize * 57 + 41}>
              <div className={isPending ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
                <PersonalSaleTable sales={sales} />
              </div>
            </AnimatedTableContainer>
            <DataTablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>

          {/* Mobile: load more */}
          <div className="md:hidden">
            <div className={isPending ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
              <PersonalSaleTable sales={mobileSales} />
            </div>
            {hasMoreMobile && (
              <div className="pt-4 pb-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLoadMore}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Carregar mais ({total - mobileVisible} restantes)
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
