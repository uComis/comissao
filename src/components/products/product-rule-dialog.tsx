'use client'

import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateProduct } from '@/app/actions/products'
import { toast } from 'sonner'
import type { Product, CommissionRule } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  availableRules: CommissionRule[]
  onProductUpdated?: (product: Product) => void
}

export function ProductRuleDialog({
  open,
  onOpenChange,
  product,
  availableRules,
  onProductUpdated,
}: Props) {
  const [ruleId, setRuleId] = useState<string>(product?.commission_rule_id || 'default')
  const [loading, setLoading] = useState(false)

  // Reset quando abre com produto diferente
  if (product && ruleId !== (product.commission_rule_id || 'default')) {
    setRuleId(product.commission_rule_id || 'default')
  }

  async function handleSave() {
    if (!product) return

    setLoading(true)
    try {
      const result = await updateProduct(product.id, {
        commission_rule_id: ruleId === 'default' ? null : ruleId,
      })

      if (result.success) {
        toast.success('Regra atualizada')
        onProductUpdated?.(result.data)
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const currentRule = availableRules.find(r => r.id === product?.commission_rule_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Regra do Produto</DialogTitle>
          <DialogDescription>
            Defina qual regra de comissão será aplicada a <strong>{product?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="product-rule">Regra de Comissão</Label>
            <Select value={ruleId} onValueChange={setRuleId}>
              <SelectTrigger id="product-rule">
                <SelectValue placeholder="Selecione uma regra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  Usar padrão da pasta
                </SelectItem>
                {availableRules.map(rule => (
                  <SelectItem key={rule.id} value={rule.id}>
                    {rule.name}
                    {rule.type === 'fixed'
                      ? ` (${rule.commission_percentage || 0}% comissão)`
                      : ` (${rule.commission_tiers?.length || 0} faixas)`
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentRule && ruleId !== 'default' && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
              <p className="font-medium">{currentRule.name}</p>
              <p>
                {currentRule.type === 'fixed'
                  ? `${currentRule.commission_percentage || 0}% comissão${currentRule.tax_percentage ? ` + ${currentRule.tax_percentage}% taxa` : ''}`
                  : `Por faixa (${currentRule.commission_tiers?.length || 0} faixas)`
                }
              </p>
            </div>
          )}

          {ruleId === 'default' && (
            <p className="text-sm text-muted-foreground">
              O produto usará a comissão padrão definida na pasta.
            </p>
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
