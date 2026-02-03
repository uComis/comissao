'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Building2, Search, X, Filter, TrendingUp, Target, Percent } from 'lucide-react'
import { SupplierTable, SupplierDialog } from '@/components/suppliers'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { StatCard } from '@/components/dashboard/stat-card'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { Fab } from '@/components/ui/fab'
import { useHeaderActions } from '@/components/layout'
import { formatCurrency } from '@/lib/utils'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

type Props = {
  initialSuppliers: PersonalSupplierWithRules[]
}

export function FornecedoresClient({ initialSuppliers }: Props) {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useHeaderActions(
    <Button size="sm" onClick={() => setDialogOpen(true)} className="hidden md:inline-flex">
      <Plus className="h-4 w-4 mr-2" />
      <span>Adicionar</span>
    </Button>
  )

  function handleSupplierCreated(newSupplier: PersonalSupplierWithRules) {
    setSuppliers(prev => [...prev, newSupplier])
    router.refresh()
  }

  // Filter
  const filtered = useMemo(() => {
    if (!search) return suppliers
    const q = search.toLowerCase()
    return suppliers.filter((s) => s.name.toLowerCase().includes(q))
  }, [suppliers, search])

  // Reset page when filter changes
  useMemo(() => { setPage(1) }, [search])

  // Paginate
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  // Stats
  const stats = useMemo(() => {
    const total = suppliers.length
    const faturado = suppliers.reduce((sum, s) => sum + (s.total_gross ?? 0), 0)
    const comissao = suppliers.reduce((sum, s) => sum + (s.total_commission ?? 0), 0)
    const comissaoMedia = faturado > 0 ? ((comissao / faturado) * 100).toFixed(1) + '%' : '0%'
    return { total, faturado, comissao, comissaoMedia }
  }, [suppliers])

  const hasFilter = search.length > 0
  const hasSuppliers = suppliers.length > 0

  const searchInput = (
    <div className="relative flex-1 min-w-0">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        placeholder="Buscar pasta..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-8 pr-7 h-8 text-sm"
      />
      {search && (
        <button
          onClick={() => setSearch('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )

  if (!hasSuppliers) {
    return (
      <div className="mx-auto max-w-4xl">
        <Fab onClick={() => setDialogOpen(true)} label="Nova Pasta" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="font-semibold">Nenhuma pasta cadastrada</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Adicione as empresas/fábricas que você representa para começar a auditar suas comissões.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Pasta
            </Button>
          </CardContent>
        </Card>
        <SupplierDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleSupplierCreated}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Fab onClick={() => setDialogOpen(true)} label="Nova Pasta" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <StatCard label="Pastas" value={String(stats.total)} icon={Building2} />
        <StatCard label="Faturado" value={formatCurrency(stats.faturado)} icon={TrendingUp} />
        <StatCard label="Comissão" value={formatCurrency(stats.comissao)} icon={Target} valueClassName="text-[#409eff]" />
        <StatCard label="Comissão Média" value={stats.comissaoMedia} icon={Percent} />
      </div>

      {/* Desktop Filter */}
      <Card className="p-3 hidden md:block">
        <div className="flex items-center gap-2">
          <div className="w-[200px] shrink-0">{searchInput}</div>
        </div>
      </Card>

      {/* Mobile Filter */}
      <Card className="p-3 md:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 relative"
            onClick={() => setDrawerOpen(true)}
          >
            <Filter className="h-3.5 w-3.5" />
            {hasFilter && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                1
              </span>
            )}
          </Button>
        </div>
      </Card>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader>
              <DrawerTitle>Filtros</DrawerTitle>
              <DrawerDescription className="sr-only">Filtrar pastas</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Busca</label>
                {searchInput}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Table + Pagination */}
      <div className="overflow-hidden" style={{ height: pageSize * 57 + 41 }}>
        <SupplierTable
          suppliers={paginated}
          onDelete={(id) => setSuppliers(prev => prev.filter(s => s.id !== id))}
        />
      </div>

      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSupplierCreated}
      />
    </div>
  )
}
