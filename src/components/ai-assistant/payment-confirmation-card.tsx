'use client'

import { Check, X, Loader2, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ToolCallData } from './ai-chat-context'

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

interface PaymentConfirmationCardProps {
  toolCall: ToolCallData
  isExecuting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function PaymentConfirmationCard({
  toolCall,
  isExecuting,
  onConfirm,
  onCancel,
}: PaymentConfirmationCardProps) {
  const receivables = toolCall.receivables || []
  const { status } = toolCall
  const total = receivables.reduce((sum, r) => sum + r.expected_commission, 0)

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b">
        <Receipt className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">
          Confirmar Recebimento ({receivables.length}{' '}
          {receivables.length === 1 ? 'parcela' : 'parcelas'})
        </span>
      </div>

      {/* Body - Receivables list */}
      <div className="px-3 py-2 space-y-2 text-sm max-h-[240px] overflow-y-auto">
        {receivables.map((r) => (
          <div
            key={`${r.personal_sale_id}-${r.installment_number}`}
            className="flex items-center justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {r.sale_number && (
                  <span className="text-xs text-muted-foreground font-mono">
                    #{r.sale_number}
                  </span>
                )}
                <span className="font-medium truncate">
                  {r.client_name || 'Sem cliente'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>
                  Parcela {r.installment_number}/{r.total_installments}
                </span>
                <span>·</span>
                <span>{formatDate(r.due_date)}</span>
                {r.supplier_name && (
                  <>
                    <span>·</span>
                    <span>{r.supplier_name}</span>
                  </>
                )}
                {r.status === 'overdue' && (
                  <>
                    <span>·</span>
                    <span className="text-destructive font-medium">Atrasada</span>
                  </>
                )}
              </div>
            </div>
            <span className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
              {formatCurrency(r.expected_commission)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="px-3 py-1.5 border-t bg-muted/30 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-sm font-bold text-green-600 dark:text-green-400">
          {formatCurrency(total)}
        </span>
      </div>

      {/* Footer / Status */}
      <div className="px-3 py-2 border-t">
        {status === 'pending' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-8"
              onClick={onConfirm}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Check className="h-3.5 w-3.5 mr-1" />
              )}
              Confirmar recebimento
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={onCancel}
              disabled={isExecuting}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Cancelar
            </Button>
          </div>
        )}

        {status === 'confirmed' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
              <Check className="h-3.5 w-3.5" />
              {toolCall.result?.count || receivables.length}{' '}
              {(toolCall.result?.count || receivables.length) === 1
                ? 'parcela marcada como recebida!'
                : 'parcelas marcadas como recebidas!'}
            </span>
            {toolCall.result?.totalAmount && (
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(toolCall.result.totalAmount)}
              </span>
            )}
          </div>
        )}

        {status === 'cancelled' && (
          <span className="text-sm text-muted-foreground">Recebimento cancelado.</span>
        )}

        {status === 'error' && (
          <span className="text-sm text-destructive">
            {toolCall.error || 'Erro ao registrar recebimento.'}
          </span>
        )}
      </div>
    </div>
  )
}
