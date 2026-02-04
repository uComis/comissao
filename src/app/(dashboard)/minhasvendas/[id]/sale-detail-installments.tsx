'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Loader2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { markReceivableAsReceived, undoReceivableReceived, type ReceivableRow } from '@/app/actions/receivables'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  saleId: string
  receivables: ReceivableRow[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const finalStr = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`
  return new Intl.DateTimeFormat('pt-BR').format(new Date(finalStr))
}

export function SaleDetailInstallments({ saleId, receivables }: Props) {
  const [loading, setLoading] = useState<number | null>(null)
  const [selectedInstallment, setSelectedInstallment] = useState<ReceivableRow | null>(null)
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0])
  const isMobile = useIsMobile()

  const today = new Date().toISOString().split('T')[0]
  const isSinglePayment = receivables.length === 1

  const handleMarkAsReceived = async (receivable: ReceivableRow) => {
    setLoading(receivable.installment_number)
    try {
      const result = await markReceivableAsReceived(
        receivable.personal_sale_id,
        receivable.installment_number,
        receivable.expected_commission,
        receivedDate
      )
      if (result.success) {
        toast.success('Parcela marcada como recebida')
        setSelectedInstallment(null)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Erro ao marcar como recebida')
    } finally {
      setLoading(null)
    }
  }

  const handleUndo = async (receivable: ReceivableRow) => {
    setLoading(receivable.installment_number)
    try {
      const result = await undoReceivableReceived(
        receivable.personal_sale_id,
        receivable.installment_number
      )
      if (result.success) {
        toast.success('Recebimento desfeito')
        setSelectedInstallment(null)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Erro ao desfazer recebimento')
    } finally {
      setLoading(null)
    }
  }

  const openDrawer = (receivable: ReceivableRow) => {
    setSelectedInstallment(receivable)
    if (receivable.received_at) {
      setReceivedDate(receivable.received_at.split('T')[0])
    } else {
      setReceivedDate(new Date().toISOString().split('T')[0])
    }
  }

  if (receivables.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Nenhuma parcela encontrada
      </div>
    )
  }

  // Visualização para pagamento à vista
  if (isSinglePayment) {
    const receivable = receivables[0]
    const isReceived = receivable.status === 'received'
    const isOverdue = receivable.status === 'overdue'
    const isToday = receivable.due_date === today
    const isLoading = loading === receivable.installment_number

    return (
      <>
        <div
          onClick={() => openDrawer(receivable)}
          className={cn(
            'p-3 rounded-xl border cursor-pointer transition-all active:scale-[0.98]',
            isReceived && 'bg-green-500/5 border-green-500/20',
            isOverdue && !isReceived && 'bg-destructive/5 border-destructive/20',
            isToday && !isReceived && !isOverdue && 'bg-amber-500/5 border-amber-500/20',
            !isReceived && !isOverdue && !isToday && 'bg-card hover:bg-muted/50'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : isReceived ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : null}
              <span className={cn(
                'text-sm font-medium',
                isReceived && 'text-green-600'
              )}>
                Pagamento à vista
              </span>
              {isOverdue && !isReceived && (
                <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full uppercase">
                  Atrasada
                </span>
              )}
              {isToday && !isOverdue && !isReceived && (
                <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full uppercase">
                  Hoje
                </span>
              )}
            </div>
            <p className={cn(
              'text-base font-bold tabular-nums text-green-600'
            )}>
              {formatCurrency(receivable.expected_commission)}
            </p>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {isReceived && receivable.received_at ? (
              <span className="text-green-600">Recebido em {formatDate(receivable.received_at)}</span>
            ) : (
              <span>Vence {formatDate(receivable.due_date)}</span>
            )}
          </div>
        </div>

        {renderDrawerDialog()}
      </>
    )
  }

  // Visualização para parcelado
  return (
    <>
      <div className="space-y-2">
        {receivables.map((receivable) => {
          const isReceived = receivable.status === 'received'
          const isOverdue = receivable.status === 'overdue'
          const isToday = receivable.due_date === today
          const isLoading = loading === receivable.installment_number

          return (
            <div
              key={receivable.installment_number}
              onClick={() => openDrawer(receivable)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all active:scale-[0.98]',
                isReceived && 'bg-green-500/5 border-green-500/20',
                isOverdue && !isReceived && 'bg-destructive/5 border-destructive/20',
                isToday && !isReceived && !isOverdue && 'bg-amber-500/5 border-amber-500/20',
                !isReceived && !isOverdue && !isToday && 'bg-card hover:bg-muted/50'
              )}
            >
              {/* Status icon */}
              <div className="shrink-0">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : isReceived ? (
                  <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                ) : (
                  <div className={cn(
                    'h-6 w-6 rounded-full border-2 flex items-center justify-center',
                    isOverdue ? 'border-destructive' : isToday ? 'border-amber-500' : 'border-muted-foreground/30'
                  )}>
                    <span className={cn(
                      'text-xs font-bold',
                      isOverdue ? 'text-destructive' : isToday ? 'text-amber-600' : 'text-muted-foreground'
                    )}>
                      {receivable.installment_number}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-sm font-medium',
                    isReceived && 'text-muted-foreground'
                  )}>
                    {receivable.installment_number}ª parcela
                  </span>
                  {isOverdue && (
                    <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full uppercase">
                      Atrasada
                    </span>
                  )}
                  {isToday && !isOverdue && !isReceived && (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full uppercase">
                      Hoje
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Vence {formatDate(receivable.due_date)}</span>
                  {isReceived && receivable.received_at && (
                    <>
                      <span>•</span>
                      <span className="text-green-600">Recebido {formatDate(receivable.received_at)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Value */}
              <div className="text-right shrink-0">
                <p className={cn(
                  'text-sm font-bold tabular-nums text-green-600'
                )}>
                  {formatCurrency(receivable.expected_commission)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {renderDrawerDialog()}
    </>
  )

  function renderDrawerDialog() {
    const actionContent = (
      <div className="space-y-4">
        {selectedInstallment?.status !== 'received' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="received-date">Data do recebimento</Label>
              <Input
                id="received-date"
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => selectedInstallment && handleMarkAsReceived(selectedInstallment)}
              disabled={loading !== null}
            >
              {loading === selectedInstallment?.installment_number ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Marcar como recebido
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-center">
              <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-600">
                {isSinglePayment ? 'Pagamento recebido' : 'Parcela recebida'}
              </p>
              {selectedInstallment.received_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  em {formatDate(selectedInstallment.received_at)}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => selectedInstallment && handleUndo(selectedInstallment)}
              disabled={loading !== null}
            >
              {loading === selectedInstallment?.installment_number ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Desfazer recebimento
            </Button>
          </>
        )}
      </div>
    )

    // Mobile: Drawer
    if (isMobile) {
      return (
        <Drawer open={!!selectedInstallment} onOpenChange={(open) => !open && setSelectedInstallment(null)}>
          <DrawerContent>
            <div className="mx-auto w-full max-w-lg">
              <DrawerHeader>
                <DrawerTitle>
                  {isSinglePayment ? 'Pagamento à vista' : `${selectedInstallment?.installment_number}ª Parcela`}
                </DrawerTitle>
                <DrawerDescription>
                  {selectedInstallment && formatCurrency(selectedInstallment.expected_commission)}
                  {' • '}
                  Vence em {selectedInstallment && formatDate(selectedInstallment.due_date)}
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-6">
                {actionContent}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )
    }

    // Desktop: Dialog
    return (
      <Dialog open={!!selectedInstallment} onOpenChange={(open) => !open && setSelectedInstallment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isSinglePayment ? 'Pagamento à vista' : `${selectedInstallment?.installment_number}ª Parcela`}
            </DialogTitle>
            <DialogDescription>
              {selectedInstallment && formatCurrency(selectedInstallment.expected_commission)}
              {' • '}
              Vence em {selectedInstallment && formatDate(selectedInstallment.due_date)}
            </DialogDescription>
          </DialogHeader>
          {actionContent}
        </DialogContent>
      </Dialog>
    )
  }
}
