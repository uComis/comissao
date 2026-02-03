'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { MonthPicker } from '@/components/dashboard/month-picker'
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
import { NavigationPicker } from '@/components/ui/navigation-picker'
import { Fab } from '@/components/ui/fab'
import { ShoppingBag, TrendingUp, Target, DollarSign, Plus, Filter } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import type { PersonalSale } from '@/types'

const PAGE_SIZE_DEFAULT = 10

type Props = {
  sales: PersonalSale[]
}

export function MinhasVendasClient({ sales }: Props) {
  const isMobile = useIsMobile()
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [search, setSearch] = useState('')
  const [supplierId, setSupplierId] = useState<string>('all')
  const [clientId, setClientId] = useState<string>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT)
  const [mobileVisible, setMobileVisible] = useState(PAGE_SIZE_DEFAULT)

  const selectFilterCount = (supplierId !== 'all' ? 1 : 0) + (clientId !== 'all' ? 1 : 0)
  const drawerFilterCount = selectFilterCount + (search ? 1 : 0)

  const suppliers = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of sales) {
      if (s.supplier?.id && s.supplier?.name) map.set(s.supplier.id, s.supplier.name)
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [sales])

  const clients = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of sales) {
      if (s.client?.id && s.client?.name) map.set(s.client.id, s.client.name)
      else if (s.client_name) map.set(s.client_name, s.client_name)
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [sales])

  const filtered = useMemo(() => {
    return sales.filter((sale) => {
      if (sale.sale_date) {
        const d = new Date(sale.sale_date + 'T00:00:00')
        if (d.getFullYear() !== month.getFullYear() || d.getMonth() !== month.getMonth()) return false
      }
      if (search) {
        const q = search.toLowerCase()
        if (!sale.client_name?.toLowerCase().includes(q) && !sale.supplier?.name?.toLowerCase().includes(q)) return false
      }
      if (supplierId !== 'all' && sale.supplier?.id !== supplierId) return false
      if (clientId !== 'all' && sale.client?.id !== clientId && sale.client_name !== clientId) return false
      return true
    })
  }, [sales, month, search, supplierId, clientId])

  // Reset pagination when filters change
  useMemo(() => { setPage(1); setMobileVisible(PAGE_SIZE_DEFAULT) }, [search, supplierId, clientId, month])

  const paginated = useMemo(() => {
    if (isMobile) return filtered.slice(0, mobileVisible)
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize, isMobile, mobileVisible])

  const stats = useMemo(() => {
    const count = filtered.length
    const faturado = filtered.reduce((sum, s) => sum + (s.gross_value || 0), 0)
    const comissao = filtered.reduce((sum, s) => sum + (s.commission_value || 0), 0)
    const ticket = count > 0 ? faturado / count : 0
    return { count, faturado, comissao, ticket }
  }, [filtered])

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

  const hasMoreMobile = mobileVisible < filtered.length

  return (
    <div className="space-y-4">
      {/* FAB Mobile */}
      <Fab href="/minhasvendas/nova" label="Nova Venda" />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <StatCard label="Vendas" value={String(stats.count)} icon={ShoppingBag} subtitle="no mês" />
        <StatCard label="Faturado" value={formatCurrency(stats.faturado)} icon={TrendingUp} />
        <StatCard label="Comissão" value={formatCurrency(stats.comissao)} icon={Target} valueClassName="text-[#409eff]" />
        <StatCard label="Ticket Médio" value={formatCurrency(stats.ticket)} icon={DollarSign} />
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
          <Button asChild>
            <Link href="/minhasvendas/nova">
              <Plus className="h-4 w-4 mr-2" />
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
        </div>
      </Card>

      {/* Month Navigation */}
      <NavigationPicker>
        <MonthPicker value={month} onChange={setMonth} />
      </NavigationPicker>

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
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma venda encontrada neste período.
        </div>
      ) : (
        <>
          {/* Desktop: table + pagination */}
          <div className="hidden md:block">
            <AnimatedTableContainer transitionKey={page} minHeight={pageSize * 57 + 41}>
              <PersonalSaleTable sales={paginated} />
            </AnimatedTableContainer>
            <DataTablePagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>

          {/* Mobile: load more */}
          <div className="md:hidden">
            <PersonalSaleTable sales={paginated} />
            {hasMoreMobile && (
              <div className="pt-4 pb-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setMobileVisible((v) => v + PAGE_SIZE_DEFAULT)}
                >
                  Carregar mais ({filtered.length - mobileVisible} restantes)
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
