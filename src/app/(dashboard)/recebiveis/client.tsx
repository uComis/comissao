'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, FilterX, CalendarCheck, X, Wallet } from 'lucide-react'
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

  // --- Filtering ---

  const filteredReceivables = useMemo(() => {
    return receivables.filter((r) => {
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'pending' && (r.status === 'pending' || r.status === 'overdue')) ||
        (filterStatus === 'overdue' && r.status === 'overdue') ||
        (filterStatus === 'received' && r.status === 'received')

      if (!searchTerm) return matchesStatus

      if (isNumeric(searchTerm)) {
        return matchesStatus && r.sale_number === parseInt(searchTerm.trim(), 10)
      }
      if (isUUID(searchTerm)) {
        return matchesStatus && r.personal_sale_id === searchTerm.trim()
      }

      const searchLower = searchTerm.toLowerCase()
      return (
        matchesStatus &&
        (r.client_name?.toLowerCase().includes(searchLower) ||
          r.supplier_name?.toLowerCase().includes(searchLower))
      )
    })
  }, [receivables, filterStatus, searchTerm])

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

  const hasActiveFilters = filterStatus !== 'all' || searchTerm

  return (
    <div className={selectedIds.length > 0 ? 'pb-28' : ''}>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Stats */}
        <ReceivableStats
          stats={stats}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          formatCurrency={formatCurrency}
        />

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente, fornecedor ou venda..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground shrink-0">
              <FilterX className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Limpar</span>
            </Button>
          )}
        </div>

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
