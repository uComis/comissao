'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Filter, Users, TrendingUp, Target, DollarSign } from 'lucide-react'
import { ClientTable } from '@/components/clients/client-table'
import { ClientDialog } from '@/components/clients/client-dialog'
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
import { useIsMobile } from '@/hooks/use-mobile'
import { formatCurrency } from '@/lib/utils'
import type { PersonalClient } from '@/types'

const PAGE_SIZE_DEFAULT = 10

type Props = {
  initialClients: PersonalClient[]
}

export function ClientesClient({ initialClients }: Props) {
  const isMobile = useIsMobile()
  const [clients, setClients] = useState<PersonalClient[]>(initialClients)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<PersonalClient | null>(null)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT)
  const [mobileVisible, setMobileVisible] = useState(PAGE_SIZE_DEFAULT)

  function handleNewClient() {
    setEditingClient(null)
    setDialogOpen(true)
  }

  function handleEdit(client: PersonalClient) {
    setEditingClient(client)
    setDialogOpen(true)
  }

  function handleSuccess(client: PersonalClient) {
    if (editingClient) {
      setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)))
    } else {
      setClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)))
    }
  }

  function handleDeleted(clientId: string) {
    setClients((prev) => prev.filter((c) => c.id !== clientId))
  }

  const filtered = useMemo(() => {
    if (!search) return clients
    const q = search.toLowerCase()
    return clients.filter((c) => c.name.toLowerCase().includes(q))
  }, [clients, search])

  // Reset pagination when filter changes
  useMemo(() => { setPage(1); setMobileVisible(PAGE_SIZE_DEFAULT) }, [search])

  const paginated = useMemo(() => {
    if (isMobile) return filtered.slice(0, mobileVisible)
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize, isMobile, mobileVisible])

  const stats = useMemo(() => {
    const total = clients.length
    const clientsWithSales = clients.filter((c) => (c.total_sales ?? 0) > 0)
    const faturado = clients.reduce((sum, c) => sum + (c.total_gross ?? 0), 0)
    const comissao = clients.reduce((sum, c) => sum + (c.total_commission ?? 0), 0)
    const ticket = clientsWithSales.length > 0 ? faturado / clientsWithSales.length : 0
    return { total, faturado, comissao, ticket }
  }, [clients])

  const hasFilter = search.length > 0
  const hasMoreMobile = mobileVisible < filtered.length

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* FAB Mobile */}
      <Fab onClick={handleNewClient} label="Novo Cliente" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <StatCard label="Clientes" value={String(stats.total)} icon={Users} />
        <StatCard label="Faturado" value={formatCurrency(stats.faturado)} icon={TrendingUp} />
        <StatCard label="Comissão" value={formatCurrency(stats.comissao)} icon={Target} valueClassName="text-[#409eff]" />
        <StatCard label="Ticket Médio" value={formatCurrency(stats.ticket)} icon={DollarSign} />
      </div>

      {/* Desktop Filter */}
      <Card className="p-3 hidden md:block">
        <div className="flex items-center gap-2">
          <ExpandableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar cliente..."
          />
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={handleNewClient}>
            <Plus className="h-4 w-4 mr-1.5" />
            Novo Cliente
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
              <DrawerDescription className="sr-only">Filtrar clientes</DrawerDescription>
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
          <ClientTable clients={paginated} onEdit={handleEdit} onDeleted={handleDeleted} />
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
        <ClientTable clients={paginated} onEdit={handleEdit} onDeleted={handleDeleted} />
        {hasMoreMobile && (
          <div className="pt-4 pb-2">
            <Button variant="outline" className="w-full" onClick={() => setMobileVisible((v) => v + PAGE_SIZE_DEFAULT)}>
              Carregar mais ({filtered.length - mobileVisible} restantes)
            </Button>
          </div>
        )}
      </div>

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editingClient}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
