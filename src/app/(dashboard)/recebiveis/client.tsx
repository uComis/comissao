'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Search,
  FilterX,
  X,
  CheckCircle,
  CalendarCheck,
  DollarSign
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { StatCard } from '@/components/dashboard/stat-card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from '@/lib/utils'
import { markReceivableAsReceived, undoReceivableReceived, type ReceivableRow, type ReceivablesStats } from '@/app/actions/receivables'
import { toast } from 'sonner'
import { useSetPageHeader, useHeaderActions } from '@/components/layout'

type Props = {
  receivables: ReceivableRow[]
  stats: ReceivablesStats
  isHome?: boolean
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateStr: string): string {
  // Se já tiver 'T', é um timestamp completo, não precisa concatenar
  const finalStr = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`
  const date = new Date(finalStr)
  
  if (isNaN(date.getTime())) return 'Data Inválida'
  
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date)
}

function getMonthYear(dateStr: string): string {
  const finalStr = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`
  const date = new Date(finalStr)
  
  if (isNaN(date.getTime())) return 'Mês Inválido'
  
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
}

// Helper to check if a string looks like a UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str.trim())
}

// Helper to check if a string is a number
function isNumeric(str: string): boolean {
  return /^\d+$/.test(str.trim())
}

export function ReceivablesClient({ receivables, stats, isHome }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showReceived, setShowReceived] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'received'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedMonths, setExpandedMonths] = useState<string[]>([])
  
  // Modo Conciliação
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [receivedAtDate, setReceivedAtDate] = useState(new Date().toISOString().split('T')[0])

  const today = new Date().toISOString().split('T')[0]

  // Initialize searchTerm from URL parameter on mount
  useEffect(() => {
    const saleId = searchParams.get('saleId')
    if (saleId) {
      setSearchTerm(saleId)
    }
  }, [searchParams])

  const filteredReceivables = useMemo(() => {
    return receivables.filter(r => {
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'pending' && (r.status === 'pending' || r.status === 'overdue')) ||
        (filterStatus === 'overdue' && r.status === 'overdue') ||
        (filterStatus === 'received' && r.status === 'received')
      
      if (!searchTerm) {
        return matchesStatus
      }

      // If searchTerm is a number, filter by sale_number
      if (isNumeric(searchTerm)) {
        const saleNumber = parseInt(searchTerm.trim(), 10)
        const matchesSaleNumber = r.sale_number === saleNumber
        return matchesStatus && matchesSaleNumber
      }

      // If searchTerm looks like a UUID, filter by personal_sale_id
      if (isUUID(searchTerm)) {
        const matchesSaleId = r.personal_sale_id === searchTerm.trim()
        return matchesStatus && matchesSaleId
      }
      
      // Otherwise, search by client/supplier name (existing behavior)
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        r.client_name?.toLowerCase().includes(searchLower) ||
        r.supplier_name?.toLowerCase().includes(searchLower)
      
      return matchesStatus && matchesSearch
    })
  }, [receivables, filterStatus, searchTerm])

  const displayPending = useMemo(() => {
    return filteredReceivables.filter(r => r.status !== 'received')
  }, [filteredReceivables])

  const displayReceived = useMemo(() => {
    return filteredReceivables.filter(r => r.status === 'received')
  }, [filteredReceivables])

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, ReceivableRow[]> = {}
    for (const r of displayPending) {
      const monthKey = getMonthYear(r.due_date)
      if (!groups[monthKey]) groups[monthKey] = []
      groups[monthKey].push(r)
    }
    return groups
  }, [displayPending])

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleBatchConfirm = async () => {
    setLoading(true)
    let successCount = 0
    let errorCount = 0

    try {
      const selectedReceivables = receivables.filter(r => selectedIds.includes(`${r.personal_sale_id}-${r.installment_number}`))
      
      for (const r of selectedReceivables) {
        const result = await markReceivableAsReceived(
          r.personal_sale_id,
          r.installment_number,
          r.expected_commission,
          receivedAtDate
        )
        if (result.success) successCount++
        else errorCount++
      }

      if (successCount > 0) toast.success(`${successCount} recebimentos registrados com sucesso`)
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
      const result = await undoReceivableReceived(
        receivable.personal_sale_id,
        receivable.installment_number
      )
      if (result.success) toast.success('Recebimento desfeito')
      else toast.error(result.error)
    } catch {
      toast.error('Erro ao desfazer recebimento')
    } finally {
      setLoading(false)
    }
  }

  const isEmpty = receivables.length === 0

  useSetPageHeader({
    title: isHome ? 'Faturamento' : 'Recebíveis',
    description: isHome ? 'Resumo de fluxo de caixa e comissões.' : 'Gerencie seu fluxo de comissões com precisão.',
  })
  useHeaderActions(
    !isEditMode ? (
      <Button
        onClick={() => setIsEditMode(true)}
        className="bg-primary hover:bg-primary/90 shadow-lg group"
      >
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
        <span className="hidden md:inline">Cancelar Edição</span>
      </Button>
    )
  )

  return (
    <div className="relative pb-24">
      <div className="space-y-6 max-w-5xl mx-auto">

        {/* Cards de Totais */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard
            label="Total Projetado"
            value={formatCurrency(stats.totalPending + stats.totalOverdue + stats.totalReceived)}
            icon={DollarSign}
            subtitle={`${stats.countPending + stats.countOverdue + stats.countReceived} parcelas`}
            onClick={() => setFilterStatus('all')}
            active={filterStatus === 'all'}
          />
          <StatCard
            label="A Receber"
            value={formatCurrency(stats.totalPending)}
            icon={Clock}
            subtitle={`${stats.countPending} parcelas`}
            onClick={() => setFilterStatus('pending')}
            active={filterStatus === 'pending'}
          />
          <StatCard
            label="Atrasados"
            value={formatCurrency(stats.totalOverdue)}
            icon={AlertTriangle}
            subtitle={`${stats.countOverdue} parcelas`}
            onClick={() => setFilterStatus('overdue')}
            active={filterStatus === 'overdue'}
          />
          <StatCard
            label="Recebidos"
            value={formatCurrency(stats.totalReceived)}
            icon={CheckCircle2}
            subtitle={`${stats.countReceived} parcelas`}
            onClick={() => setFilterStatus('received')}
            active={filterStatus === 'received'}
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/30 p-4 rounded-xl border border-border shadow-inner">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar cliente, fornecedor ou ID da venda..." 
              className="pl-9 bg-background border-none shadow-sm focus-visible:ring-1"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                // Update URL parameter if it's a number or UUID, or remove it if cleared
                const params = new URLSearchParams(searchParams.toString())
                if (isNumeric(e.target.value) || isUUID(e.target.value)) {
                  params.set('saleId', e.target.value.trim())
                } else if (!e.target.value) {
                  params.delete('saleId')
                }
                const newUrl = `/faturamento${params.toString() ? `?${params.toString()}` : ''}`
                router.replace(newUrl, { scroll: false })
              }}
            />
          </div>
          
          {(filterStatus !== 'all' || searchTerm) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { 
                setFilterStatus('all')
                setSearchTerm('')
                // Clear URL parameter
                const params = new URLSearchParams(searchParams.toString())
                params.delete('saleId')
                router.push(`/faturamento${params.toString() ? `?${params.toString()}` : ''}`)
              }}
              className="text-muted-foreground hover:text-primary"
            >
              <FilterX className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          )}
        </div>

        {/* Lista de Pendentes */}
        {!isEmpty && Object.keys(groupedByMonth).length > 0 && (
          <Accordion 
            type="multiple" 
            value={filterStatus !== 'all' || searchTerm ? Object.keys(groupedByMonth) : expandedMonths}
            onValueChange={setExpandedMonths}
            className="space-y-2"
          >
            {Object.entries(groupedByMonth).map(([month, items]) => {
              const monthTotal = items.reduce((acc, curr) => acc + (curr.expected_commission || 0), 0)
              const hasOverdue = items.some(item => item.status === 'overdue')
              
              // Check if this month is current month
              const currentMonthYear = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())
              const isCurrentMonth = month.toLowerCase() === currentMonthYear.toLowerCase()
              const isPastMonth = !isCurrentMonth && items.some(item => item.due_date < today)
              
              return (
                <AccordionItem 
                  key={month} 
                  value={month}
                  className="border rounded-lg overflow-hidden shadow-sm transition-shadow duration-300 ease-out data-[state=open]:shadow-lg data-[state=open]:shadow-black/15"
                >
                  <AccordionTrigger className="w-full flex items-center justify-between p-4 bg-white dark:bg-card hover:bg-muted/50 transition-colors hover:no-underline [&>svg]:hidden rounded-t-lg [[data-state=open]_&]:rounded-b-none">
                    <div className="flex items-center gap-4">
                      {hasOverdue && (
                        <span 
                          className={cn(
                            "w-3 h-3 rounded-full shrink-0 animate-pulse",
                            isPastMonth ? "bg-red-500" : "bg-orange-500"
                          )}
                          title={isPastMonth ? "Parcelas vencidas" : "Atenção: parcelas vencendo"}
                        />
                      )}
                      <div className="flex flex-col items-start">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{month}</h3>
                        <div className="text-xs text-muted-foreground">{items.length} parcelas</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs font-bold uppercase text-muted-foreground/60 leading-tight">Total Mês</div>
                        <div className="text-lg font-bold text-primary">{formatCurrency(monthTotal)}</div>
                      </div>
                      <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="p-0">
                    <div className="py-[30px] px-[20px] bg-muted/20 border-t max-h-[450px] overflow-y-auto custom-scrollbar">
                      <div className="grid gap-2 md:gap-1.5">
                        {items.map((receivable) => {
                          const isOverdue = receivable.status === 'overdue'
                          const isToday = receivable.due_date === today
                          const key = `${receivable.personal_sale_id}-${receivable.installment_number}`
                          const isSelected = selectedIds.includes(key)

                          return (
                            <Card 
                              key={key} 
                              onClick={() => isEditMode && toggleSelection(key)}
                              className={cn(
                                "group transition-all duration-200 border-l-4 overflow-hidden relative py-1.5 md:py-6",
                                isEditMode ? "cursor-pointer hover:border-l-primary/50" : "hover:shadow-md",
                                isSelected ? "border-l-primary shadow-inner" : 
                                isOverdue ? "border-l-destructive" : 
                                isToday ? "border-l-orange-500 shadow-sm" : 
                                "border-l-transparent"
                              )}
                            >
                              <CardContent className="p-0">
                                {/* Desktop Layout - Fixed columns for alignment */}
                                <div className="hidden md:flex items-center gap-0 p-2 px-3">
                                  {/* Checkbox */}
                                  {isEditMode && (
                                    <div 
                                      className="flex items-center justify-center w-8 shrink-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleSelection(key)}
                                        className="h-5 w-5 border-2"
                                      />
                                    </div>
                                  )}

                                  {/* Date - fixed width, stacked */}
                                  <div className="w-[50px] shrink-0 flex flex-col items-center justify-center pr-3 border-r border-border/50">
                                    <span className={cn("text-lg font-bold leading-none", isOverdue ? "text-destructive" : isToday ? "text-orange-600" : "text-foreground")}>
                                      {formatDate(receivable.due_date).split('/')[0]}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground mt-0.5">
                                      {new Date(receivable.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                                    </span>
                                  </div>

                                  {/* Client + Supplier - stacked */}
                                  <div className="flex-1 min-w-0 px-3 flex flex-col justify-center">
                                    <h4 className="font-semibold text-sm truncate">{receivable.client_name || 'Cliente Final'}</h4>
                                    <span className="text-xs text-muted-foreground truncate">{receivable.supplier_name || 'Direto'}</span>
                                    {receivable.notes && (
                                      <span className="text-xs text-muted-foreground/70 italic truncate mt-0.5">{receivable.notes}</span>
                                    )}
                                  </div>

                                  {/* Badge - absolute top right */}
                                  {isOverdue && (
                                    <Badge variant="destructive" className="absolute top-1.5 right-1.5 h-5 text-[10px] font-bold px-2 uppercase">Atrasado</Badge>
                                  )}

                                  {/* Installments + Progress bar - stacked */}
                                  <div className="w-[120px] shrink-0 px-3 flex flex-col justify-center border-l border-border/30">
                                    <span className="text-xs text-muted-foreground text-center">{receivable.installment_number}/{receivable.total_installments}</span>
                                    <div className="h-1.5 w-full rounded-full bg-gray-300 dark:bg-muted/60 overflow-hidden mt-1">
                                      <div
                                        className={cn(
                                          "h-full rounded-full",
                                          isOverdue ? "bg-destructive" : "bg-green-500"
                                        )}
                                        style={{ width: `${(receivable.installment_number / receivable.total_installments) * 100}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* Value - fixed width, right aligned, pushed to edge */}
                                  <div className="w-[130px] shrink-0 text-right pl-3 pr-1 border-l border-border/30">
                                    <span className={cn("text-base font-bold", isOverdue ? "text-destructive" : "text-green-600")}>
                                      {formatCurrency(receivable.expected_commission || 0)}
                                    </span>
                                  </div>
                                </div>

                                {/* Mobile Layout */}
                                <div className="md:hidden px-3 py-2">
                                  <div className="flex items-start gap-2">
                                    {isEditMode && (
                                      <div 
                                        className="flex items-center justify-center pt-0.5"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() => toggleSelection(key)}
                                          className="h-5 w-5 border-2"
                                        />
                                      </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                      {/* Row 1: Date LEFT + Commission RIGHT */}
                                      <div className="flex items-center justify-between mb-1">
                                        <div className={cn(
                                          "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold",
                                          isOverdue ? "bg-destructive/15 text-destructive" : 
                                          isToday ? "bg-orange-500/15 text-orange-600" : 
                                          "bg-muted text-muted-foreground"
                                        )}>
                                          <span className="font-black">{formatDate(receivable.due_date).split('/')[0]}</span>
                                          <span className="uppercase text-[10px]">{new Date(receivable.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                                          {isOverdue && <span className="text-[10px] ml-1">• ATRASADO</span>}
                                        </div>
                                        <span className={cn("text-base font-bold", isOverdue ? "text-destructive" : "text-green-600")}>
                                          {formatCurrency(receivable.expected_commission || 0)}
                                        </span>
                                      </div>

                                      {/* Row 2: Client + Installments */}
                                      <div className="flex items-start justify-between mb-[5px]">
                                        <div className="min-w-0">
                                          <h4 className="font-semibold text-sm truncate leading-tight">{receivable.client_name || 'Cliente Final'}</h4>
                                          <span className="text-xs text-muted-foreground truncate block">{receivable.supplier_name || 'Direto'}</span>
                                          {receivable.notes && (
                                            <span className="text-xs text-muted-foreground/70 italic truncate block">{receivable.notes}</span>
                                          )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground shrink-0">{receivable.installment_number} de {receivable.total_installments} parcelas</span>
                                      </div>

                                      {/* Row 3: Progress bar full width (hidden if single installment) */}
                                      {receivable.total_installments > 1 && (
                                        <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden" style={{ marginTop: '10px' }}>
                                          <div
                                            className={cn(
                                              "h-full rounded-full transition-all",
                                              isOverdue ? "bg-destructive" : "bg-green-500"
                                            )}
                                            style={{ width: `${(receivable.installment_number / receivable.total_installments) * 100}%` }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}

        {/* Histórico de Recebidos */}
        {(displayReceived.length > 0 || filterStatus === 'received') && (
          <div className="pt-4 space-y-4">
            <Button variant="outline" className="w-full justify-between h-12 text-muted-foreground" onClick={() => setShowReceived(!showReceived)}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-semibold">Histórico de Recebidos</span>
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">{displayReceived.length}</Badge>
              </div>
              {showReceived ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showReceived && (
              <div className="grid gap-3">
                {displayReceived.map((receivable) => {
                  const key = `${receivable.personal_sale_id}-${receivable.installment_number}`
                  return (
                    <Card key={key} className="group transition-all duration-200 border-l-4 border-l-green-500 bg-green-50/30 opacity-75 hover:opacity-100">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center min-w-[60px] border-r pr-4 border-border/50 opacity-60">
                          <span className="text-lg font-bold leading-none line-through">{formatDate(receivable.due_date).split('/')[0]}</span>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">{new Date(receivable.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base truncate line-through text-muted-foreground">{receivable.client_name || 'Cliente Final'}</h4>
                          <div className="text-xs text-muted-foreground mt-0.5">Recebido em {receivable.received_at ? formatDate(receivable.received_at) : '-'}</div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs font-bold uppercase text-muted-foreground/60 leading-tight">Recebido</div>
                            <div className="text-xl font-black tracking-tight text-green-700/80">{formatCurrency(receivable.received_amount || receivable.expected_commission || 0)}</div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleUndoReceived(receivable)} disabled={loading} className="text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Barra Flutuante de Ações */}
      {isEditMode && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-primary text-primary-foreground rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4 border border-white/20">
            <div className="flex flex-col">
              <span className="text-sm font-bold">{selectedIds.length} parcelas selecionadas</span>
              <span className="text-xs opacity-80">Total: {formatCurrency(receivables.filter(r => selectedIds.includes(`${r.personal_sale_id}-${r.installment_number}`)).reduce((acc, curr) => acc + (curr.expected_commission || 0), 0))}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setSelectedIds([])}
                className="font-bold"
              >
                Limpar
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setShowConfirmDialog(true)}
                className="bg-white text-black hover:bg-slate-100 font-bold shadow-lg"
              >
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação com Data Retroativa */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Recebimento</DialogTitle>
            <DialogDescription>
              Confirme a data em que estas {selectedIds.length} parcelas foram pagas.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="receive_date">Data do Recebimento</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="receive_date"
                  type="date"
                  className="pl-9"
                  value={receivedAtDate}
                  onChange={(e) => setReceivedAtDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBatchConfirm} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? "Processando..." : "Dar Baixa agora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
