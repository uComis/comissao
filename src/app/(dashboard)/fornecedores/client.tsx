'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Building2, Filter, TrendingUp, Target, Percent } from 'lucide-react'
import { SupplierTable, SupplierDialog } from '@/components/suppliers'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { AnimatedTableContainer } from '@/components/ui/animated-table-container'
import { StatCard } from '@/components/dashboard/stat-card'
import { ExpandableSearch } from '@/components/ui/expandable-search'
import { Fab } from '@/components/ui/fab'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { formatCurrency } from '@/lib/utils'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

type Props = {
  initialSuppliers: PersonalSupplierWithRules[]
}

export function FornecedoresClient({ initialSuppliers }: Props) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [mobileVisible, setMobileVisible] = useState(10)

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
  useMemo(() => { setPage(1); setMobileVisible(10) }, [search])

  // Paginate
  const paginated = useMemo(() => {
    if (isMobile) return filtered.slice(0, mobileVisible)
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize, isMobile, mobileVisible])

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
      {/* FAB Mobile */}
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
          <ExpandableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar pasta..."
          />
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="border-[#409eff] text-[#409eff] hover:bg-[#409eff]/10" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Pasta
          </Button>
        </div>
      </Card>

      {/* Mobile Filter */}
      <Card className="p-3 md:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 relative"
            onClick={() => setDrawerOpen(true)}
          >
            <Filter className="h-3.5 w-3.5" />
            {hasFilter && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                1
              </span>
            )}
          </Button>
          <div className="flex-1" />
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
                <ExpandableSearch
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar pasta..."
                  alwaysExpanded
                />
              </div>
              {hasFilter && (
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => setSearch('')}
                >
                  Limpar filtro
                </Button>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Desktop: table + pagination */}
      <div className="hidden md:block">
        <AnimatedTableContainer transitionKey={page} minHeight={pageSize * 57 + 41}>
          <SupplierTable
            suppliers={paginated}
            onDelete={(id) => setSuppliers(prev => prev.filter(s => s.id !== id))}
          />
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
        <SupplierTable
          suppliers={paginated}
          onDelete={(id) => setSuppliers(prev => prev.filter(s => s.id !== id))}
        />
        {mobileVisible < filtered.length && (
          <div className="pt-4 pb-2">
            <Button variant="outline" className="w-full" onClick={() => setMobileVisible((v) => v + 10)}>
              Carregar mais ({filtered.length - mobileVisible} restantes)
            </Button>
          </div>
        )}
      </div>

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSupplierCreated}
      />
    </div>
  )
}
