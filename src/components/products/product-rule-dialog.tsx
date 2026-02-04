'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CompactNumberInput } from '@/components/ui/compact-number-input'
import { updateProduct } from '@/app/actions/products'
import { toast } from 'sonner'
import type { Product } from '@/types'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  supplierCommission?: number | null
  supplierTax?: number | null
  onProductUpdated?: (product: Product) => void
}

export function ProductRuleDialog({
  open,
  onOpenChange,
  product,
  supplierCommission,
  supplierTax,
  onProductUpdated,
}: Props) {
  const [useDefault, setUseDefault] = useState(true)
  const [commission, setCommission] = useState(0)
  const [tax, setTax] = useState(0)
  const [loading, setLoading] = useState(false)

  // Reset quando abre com produto diferente
  useEffect(() => {
    if (product) {
      const hasOverride = product.default_commission_rate !== null && product.default_commission_rate !== undefined
      setUseDefault(!hasOverride)
      setCommission(product.default_commission_rate ?? supplierCommission ?? 0)
      setTax(product.default_tax_rate ?? supplierTax ?? 0)
    }
  }, [product, supplierCommission, supplierTax])

  async function handleSave() {
    if (!product) return

    setLoading(true)
    try {
      const result = await updateProduct(product.id, {
        default_commission_rate: useDefault ? null : commission,
        default_tax_rate: useDefault ? null : tax,
        commission_rule_id: null, // Limpa regra antiga se existia
      })

      if (result.success) {
        toast.success('Comissão atualizada')
        onProductUpdated?.(result.data)
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Comissão do Produto</DialogTitle>
          <DialogDescription>
            Defina a comissão para <strong>{product?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Toggle usar padrão vs override */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted/50 rounded-lg">
            <button
              type="button"
              onClick={() => setUseDefault(true)}
              className={cn(
                'py-2.5 text-sm font-medium rounded-md transition-all',
                useDefault
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Usar Padrão
            </button>
            <button
              type="button"
              onClick={() => setUseDefault(false)}
              className={cn(
                'py-2.5 text-sm font-medium rounded-md transition-all',
                !useDefault
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Personalizar
            </button>
          </div>

          {useDefault ? (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
              <p>Este produto usará a comissão padrão da pasta:</p>
              <p className="font-medium mt-1">
                {supplierCommission ?? 0}% comissão
                {(supplierTax ?? 0) > 0 && ` + ${supplierTax}% taxa`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Comissão (%)</Label>
                <CompactNumberInput
                  value={commission}
                  onChange={setCommission}
                  min={0}
                  max={100}
                  step={0.5}
                  decimals={2}
                  suffix="%"
                />
              </div>
              <div className="space-y-2">
                <Label>Taxa/Imposto (%)</Label>
                <CompactNumberInput
                  value={tax}
                  onChange={setTax}
                  min={0}
                  max={100}
                  step={0.5}
                  decimals={2}
                  suffix="%"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
