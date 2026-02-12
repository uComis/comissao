'use client'

import { Check, X, Loader2, ExternalLink, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ToolCallData } from './ai-chat-context'

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

interface SaleConfirmationCardProps {
  toolCall: ToolCallData
  isExecuting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function SaleConfirmationCard({
  toolCall,
  isExecuting,
  onConfirm,
  onCancel,
}: SaleConfirmationCardProps) {
  const preview = toolCall.preview
  if (!preview) return null
  const { status } = toolCall

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b">
        <ShoppingCart className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Nova Venda</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pasta</span>
          <span className="font-medium">{preview.supplier_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cliente</span>
          <span className="font-medium">{preview.client_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Data</span>
          <span className="font-medium">{formatDate(preview.sale_date)}</span>
        </div>

        <hr className="my-1" />

        <div className="flex justify-between">
          <span className="text-muted-foreground">Valor bruto</span>
          <span className="font-medium">{formatCurrency(preview.gross_value)}</span>
        </div>
        {preview.tax_rate > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxa ({preview.tax_rate.toFixed(1)}%)</span>
            <span className="font-medium text-destructive">
              -{formatCurrency(preview.gross_value - preview.net_value)}
            </span>
          </div>
        )}
        {preview.tax_rate > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor líquido</span>
            <span className="font-medium">{formatCurrency(preview.net_value)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Comissão ({preview.commission_rate.toFixed(1)}%)
          </span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(preview.commission_value)}
          </span>
        </div>

        {preview.payment_condition && preview.payment_condition !== '0' && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pagamento</span>
            <span className="font-medium">{preview.payment_condition} dias</span>
          </div>
        )}

        {preview.notes && (
          <>
            <hr className="my-1" />
            <div>
              <span className="text-muted-foreground text-xs">Obs: </span>
              <span className="text-xs">{preview.notes}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer / Status */}
      <div className="px-3 py-2 border-t bg-muted/30">
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
              Confirmar
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
              Venda criada!
            </span>
            {toolCall.result?.sale_id && (
              <a
                href={`/minhasvendas/${toolCall.result.sale_id}`}
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                Ver detalhes <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {status === 'cancelled' && (
          <span className="text-sm text-muted-foreground">Venda cancelada.</span>
        )}

        {status === 'error' && (
          <span className="text-sm text-destructive">
            {toolCall.error || 'Erro ao criar venda.'}
          </span>
        )}
      </div>
    </div>
  )
}
