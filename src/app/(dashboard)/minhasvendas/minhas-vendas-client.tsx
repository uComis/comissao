'use client'

import { useState, useMemo, useEffect, useRef, useTransition, useCallback } from 'react'
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
import { ExpandableSearch } from '@/components/ui/expandable-search'
import { FilterPopover, FilterPopoverField } from '@/components/ui/filter-popover'
import { Fab } from '@/components/ui/fab'
import { ShoppingBag, TrendingUp, Target, DollarSign, Plus, Filter, Loader2, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getPersonalSalesPaginated, type PaginatedSalesResult, type SaleMonthOption } from '@/app/actions/personal-sales'
import type { PersonalSale } from '@/types'

const PAGE_SIZE_DEFAULT = 10

type Supplier = { id: string; name: string }
type Client = { id: string; name: string }

type Props = {
  initialData: PaginatedSalesResult
  suppliers: Supplier[]
  clients: Client[]
  months: SaleMonthOption[]
}

export function MinhasVendasClient({ initialData, suppliers, clients, months }: Props) {
  const [isPending, startTransition] = useTransition()

  // Data state
  const [sales, setSales] = useState<PersonalSale[]>(initialData.data)
  const [total, setTotal] = useState(initialData.total)
  const [aggregates, setAggregates] = useState(initialData.aggregates)

  // Filter state
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [clientId, setClientId] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT)
  const [mobileVisible, setMobileVisible] = useState(PAGE_SIZE_DEFAULT)

  const selectFilterCount = (supplierId ? 1 : 0) + (clientId ? 1 : 0)
  const drawerFilterCount = selectFilterCount + (search ? 1 : 0) + (month ? 1 : 0)

  // Fetch data from server - atualiza página só quando dados chegam
  const fetchData = useCallback((newPage: number, newPageSize: number, updatePageTo?: number) => {
    startTransition(async () => {
      try {
        const result = await getPersonalSalesPaginated({
          page: newPage,
          pageSize: newPageSize,
          search: search || undefined,
          supplierId: supplierId || undefined,
          clientId: clientId || undefined,
          month: month || undefined,
        })
        // Atualiza dados e página juntos
        setSales(result.data)
        setTotal(result.total)
        setAggregates(result.aggregates)
        if (updatePageTo !== undefined) {
          setPage(updatePageTo)
        }
      } catch (error) {
        console.error('Error fetching sales:', error)
      }
    })
  }, [search, month, supplierId, clientId])

  // Fetch when filters change (reset to page 1)
  // Skip first render — initialData already has the data from the server
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setMobileVisible(PAGE_SIZE_DEFAULT)
    fetchData(1, pageSize, 1)
  }, [search, month, supplierId, clientId, pageSize, fetchData])

  const handlePageChange = (newPage: number) => {
    fetchData(newPage, pageSize, newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
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
            supplierId: supplierId || undefined,
            clientId: clientId || undefined,
            month: month || undefined,
          })
          setSales(result.data)
          setTotal(result.total)
          setAggregates(result.aggregates)
        } catch (error) {
          console.error('Error fetching more sales:', error)
        }
      })
    }
  }

  // Stats calculadas a partir dos agregados (totais reais)
  const stats = useMemo(() => {
    const faturado = aggregates.totalGross
    const comissao = aggregates.totalCommission
    const ticket = total > 0 ? faturado / total : 0
    return { count: total, faturado, comissao, ticket }
  }, [aggregates, total])

  const handleSaleDeleted = useCallback((id: string) => {
    setSales(prev => prev.filter(s => s.id !== id))
    setTotal(prev => prev - 1)
  }, [])

  function clearFilters() {
    setSupplierId('')
    setClientId('')
  }

  function clearAllFilters() {
    setSearch('')
    setMonth('')
    clearFilters()
  }

  const supplierSelect = (
    <div className="relative">
      <Select value={supplierId} onValueChange={setSupplierId}>
        <SelectTrigger className="h-8 text-sm w-full">
          <SelectValue placeholder="Todas as pastas" />
        </SelectTrigger>
        <SelectContent>
          {suppliers.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {supplierId && (
        <button
          type="button"
          onClick={() => setSupplierId('')}
          className="absolute right-7 top-1/2 -translate-y-1/2 flex items-center justify-center h-4 w-4 rounded-sm hover:bg-muted-foreground/20"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
    </div>
  )

  const clientSelect = (
    <div className="relative">
      <Select value={clientId} onValueChange={setClientId}>
        <SelectTrigger className="h-8 text-sm w-full">
          <SelectValue placeholder="Todos os clientes" />
        </SelectTrigger>
        <SelectContent>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {clientId && (
        <button
          type="button"
          onClick={() => setClientId('')}
          className="absolute right-7 top-1/2 -translate-y-1/2 flex items-center justify-center h-4 w-4 rounded-sm hover:bg-muted-foreground/20"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
    </div>
  )

  const monthSelect = (
    <div className="relative">
      <Select value={month} onValueChange={setMonth}>
        <SelectTrigger className="h-8 text-sm w-full">
          <SelectValue placeholder="Todos os meses" />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {month && (
        <button
          type="button"
          onClick={() => setMonth('')}
          className="absolute right-7 top-1/2 -translate-y-1/2 flex items-center justify-center h-4 w-4 rounded-sm hover:bg-muted-foreground/20"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
    </div>
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
        <StatCard label="Faturado" value={formatCurrency(stats.faturado)} icon={TrendingUp} subtitle="total" />
        <StatCard label="Comissão" value={formatCurrency(stats.comissao)} icon={Target} valueClassName="text-[#409eff]" subtitle="total" />
        <StatCard label="Ticket Médio" value={formatCurrency(stats.ticket)} icon={DollarSign} subtitle="média geral" />
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
          <div className="relative">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-8 text-sm w-[180px]">
                <SelectValue placeholder="Todos os meses" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {month && (
              <button
                type="button"
                onClick={() => setMonth('')}
                className="absolute right-7 top-1/2 -translate-y-1/2 flex items-center justify-center h-4 w-4 rounded-sm hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
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
                <label className="text-sm font-medium">Mês</label>
                {monthSelect}
              </div>
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
          <div className="hidden md:block space-y-0">
            <div className="relative">
              <PersonalSaleTable sales={sales} onSaleDeleted={handleSaleDeleted} />
              {isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 pointer-events-none">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
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
            <div className="relative">
              <PersonalSaleTable sales={mobileSales} onSaleDeleted={handleSaleDeleted} />
              {isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 pointer-events-none">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
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
