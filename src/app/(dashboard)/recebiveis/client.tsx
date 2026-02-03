'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Card } from '@/components/ui/card'
import { Search, Filter, CalendarCheck, X, Wallet } from 'lucide-react'
import {
  ReceivableStats,
  ReceivableList,
  ReceivableTable,
  ConciliationBar,
  ConfirmDialog,
  ReceivedSection,
} from '@/components/receivables'
import { useSetPageHeader, useHeaderActions } from '@/components/layout'
import { markReceivableAsReceived, undoReceivableReceived, type ReceivableRow, type ReceivablesStats } from '@/app/actions/receivables'
import { toast } from 'sonner'

type Props = {
  receivables: ReceivableRow[]
  stats: ReceivablesStats
  isHome?: boolean
}

type FilterStatus = 'all' | 'pending' | 'overdue' | 'received'

// --- Helpers ---

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateStr: string): string {
  const finalStr = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`
  const date = new Date(finalStr)
  if (isNaN(date.getTime())) return 'Data Inválida'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date)
}

function formatMonthShort(dateStr: string): string {
  const finalStr = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`
  const date = new Date(finalStr)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
}

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim())
}

function isNumeric(str: string): boolean {
  return /^\d+$/.test(str.trim())
}

// --- Component ---

export function ReceivablesClient({ receivables, stats, isHome }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [supplierId, setSupplierId] = useState<string>('all')
  const [clientId, setClientId] = useState<string>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Conciliation state
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [receivedAtDate, setReceivedAtDate] = useState(new Date().toISOString().split('T')[0])

  const today = new Date().toISOString().split('T')[0]

  // Deep link support
  useEffect(() => {
    const saleId = searchParams.get('saleId')
    if (saleId) setSearchTerm(saleId)
  }, [searchParams])

  // --- Derived filter options ---

  const suppliers = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of receivables) {
      if (r.supplier_id && r.supplier_name) map.set(r.supplier_id, r.supplier_name)
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [receivables])

  const clients = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of receivables) {
      if (r.client_name) map.set(r.client_name, r.client_name)
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [receivables])

  // --- Filtering ---

  const filteredReceivables = useMemo(() => {
    return receivables.filter((r) => {
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'pending' && (r.status === 'pending' || r.status === 'overdue')) ||
        (filterStatus === 'overdue' && r.status === 'overdue') ||
        (filterStatus === 'received' && r.status === 'received')

      if (!matchesStatus) return false

      if (supplierId !== 'all' && r.supplier_id !== supplierId) return false
      if (clientId !== 'all' && r.client_name !== clientId) return false

      if (!searchTerm) return true

      if (isNumeric(searchTerm)) {
        return r.sale_number === parseInt(searchTerm.trim(), 10)
      }
      if (isUUID(searchTerm)) {
        return r.personal_sale_id === searchTerm.trim()
      }

      const searchLower = searchTerm.toLowerCase()
      return (
        r.client_name?.toLowerCase().includes(searchLower) ||
        r.supplier_name?.toLowerCase().includes(searchLower)
      )
    })
  }, [receivables, filterStatus, searchTerm, supplierId, clientId])

  const displayPending = useMemo(() => filteredReceivables.filter((r) => r.status !== 'received'), [filteredReceivables])
  const displayReceived = useMemo(() => filteredReceivables.filter((r) => r.status === 'received'), [filteredReceivables])

  // --- Selection ---

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }, [])

  const selectedTotal = useMemo(() => {
    return receivables
      .filter((r) => selectedIds.includes(`${r.personal_sale_id}-${r.installment_number}`))
      .reduce((acc, curr) => acc + (curr.expected_commission || 0), 0)
  }, [receivables, selectedIds])

  // --- Actions ---

  const handleBatchConfirm = async () => {
    setLoading(true)
    let successCount = 0
    let errorCount = 0

    try {
      const selected = receivables.filter((r) =>
        selectedIds.includes(`${r.personal_sale_id}-${r.installment_number}`)
      )

      for (const r of selected) {
        const result = await markReceivableAsReceived(
          r.personal_sale_id,
          r.installment_number,
          r.expected_commission,
          receivedAtDate
        )
        if (result.success) successCount++
        else errorCount++
      }

      if (successCount > 0) toast.success(`${successCount} recebimentos registrados`)
      if (errorCount > 0) toast.error(`Erro em ${errorCount} registros`)

      setIsEditMode(false)
      setSelectedIds([])
      setShowConfirmDialog(false)
    } catch {
      toast.error('Erro ao processar recebimentos')
    } finally {
      setLoading(false)
    }
  }

  const handleUndoReceived = async (receivable: ReceivableRow) => {
    setLoading(true)
    try {
      const result = await undoReceivableReceived(receivable.personal_sale_id, receivable.installment_number)
      if (result.success) toast.success('Recebimento desfeito')
      else toast.error(result.error)
    } catch {
      toast.error('Erro ao desfazer recebimento')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    const params = new URLSearchParams(searchParams.toString())
    if (isNumeric(value) || isUUID(value)) {
      params.set('saleId', value.trim())
    } else if (!value) {
      params.delete('saleId')
    }
    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`
    router.replace(newUrl, { scroll: false })
  }

  const clearFilters = () => {
    setFilterStatus('all')
    setSearchTerm('')
    setSupplierId('all')
    setClientId('all')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('saleId')
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`)
  }

  // --- Header ---

  useSetPageHeader({ title: isHome ? 'Faturamento' : 'Recebíveis' })

  useHeaderActions(
    !isEditMode ? (
      <Button onClick={() => setIsEditMode(true)} className="bg-primary hover:bg-primary/90 shadow-lg group">
        <CalendarCheck className="h-4 w-4 transition-transform group-hover:scale-110 md:mr-2" />
        <span className="hidden md:inline">Registrar Recebimentos</span>
      </Button>
    ) : (
      <Button
        variant="outline"
        onClick={() => { setIsEditMode(false); setSelectedIds([]) }}
        className="border-destructive text-destructive hover:bg-destructive/10"
      >
        <X className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">Cancelar</span>
      </Button>
    )
  )

  // --- Filter UI elements ---

  const searchInput = (
    <div className="relative flex-1 min-w-0">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-8 pr-7 h-8 text-sm" />
      {searchTerm && (
        <button onClick={() => handleSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )

  const supplierSelect = (
    <div className="relative">
      <Select value={supplierId} onValueChange={setSupplierId}>
        <SelectTrigger className="h-8 text-sm w-full"><SelectValue placeholder="Pasta" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as pastas</SelectItem>
          {suppliers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
        </SelectContent>
      </Select>
      {supplierId !== 'all' && (
        <button onClick={() => setSupplierId('all')} className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )

  const clientSelect = (
    <div className="relative">
      <Select value={clientId} onValueChange={setClientId}>
        <SelectTrigger className="h-8 text-sm w-full"><SelectValue placeholder="Cliente" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os clientes</SelectItem>
          {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
        </SelectContent>
      </Select>
      {clientId !== 'all' && (
        <button onClick={() => setClientId('all')} className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )

  // --- Empty State ---

  if (receivables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Wallet className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="font-semibold text-lg">Nenhuma parcela encontrada</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Suas comissões aparecerão aqui quando você registrar vendas com parcelas.
        </p>
      </div>
    )
  }

  const selectFilterCount = (supplierId !== 'all' ? 1 : 0) + (clientId !== 'all' ? 1 : 0)

  return (
    <div className={selectedIds.length > 0 ? 'pb-28' : ''}>
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Stats */}
        <ReceivableStats
          stats={stats}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          formatCurrency={formatCurrency}
        />

        {/* Desktop Filters */}
        <Card className="p-3 hidden md:block">
          <div className="flex items-center gap-2">
            <div className="w-[200px] shrink-0">{searchInput}</div>
            <div className="w-[150px] shrink-0">{supplierSelect}</div>
            <div className="w-[150px] shrink-0">{clientSelect}</div>
          </div>
        </Card>

        {/* Mobile Filters */}
        <Card className="p-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">{searchInput}</div>
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 relative" onClick={() => setDrawerOpen(true)}>
              <Filter className="h-3.5 w-3.5" />
              {selectFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {selectFilterCount}
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
                <DrawerDescription className="sr-only">Filtrar recebíveis</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Pasta</label>
                  {supplierSelect}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Cliente</label>
                  {clientSelect}
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* List (mobile) + Table (desktop) */}
        <ReceivableList
          receivables={displayPending}
          today={today}
          isEditMode={isEditMode}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          formatMonthShort={formatMonthShort}
        />
        <ReceivableTable
          receivables={displayPending}
          today={today}
          isEditMode={isEditMode}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          formatMonthShort={formatMonthShort}
        />

        {/* Received History */}
        <ReceivedSection
          receivables={displayReceived}
          onUndo={handleUndoReceived}
          loading={loading}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      </div>

      {/* Conciliation Bar */}
      <ConciliationBar
        selectedCount={selectedIds.length}
        totalCount={displayPending.length}
        selectedTotal={selectedTotal}
        onClear={() => setSelectedIds([])}
        onConfirm={() => setShowConfirmDialog(true)}
        formatCurrency={formatCurrency}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        selectedCount={selectedIds.length}
        selectedTotal={selectedTotal}
        receivedAtDate={receivedAtDate}
        onDateChange={setReceivedAtDate}
        onConfirm={handleBatchConfirm}
        loading={loading}
        formatCurrency={formatCurrency}
      />
    </div>
  )
}
