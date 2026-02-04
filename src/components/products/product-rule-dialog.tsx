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
import { Input } from '@/components/ui/input'
import { CompactNumberInput } from '@/components/ui/compact-number-input'
import { DashedActionButton } from '@/components/ui/dashed-action-button'
import { updateProductCommission } from '@/app/actions/products'
import { toast } from 'sonner'
import type { Product, CommissionTier } from '@/types'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  supplierCommission?: number | null
  supplierTax?: number | null
  onProductUpdated?: (product: Product) => void
}

type RuleType = 'default' | 'fixed' | 'tiered'

export function ProductRuleDialog({
  open,
  onOpenChange,
  product,
  supplierCommission,
  supplierTax,
  onProductUpdated,
}: Props) {
  const [ruleType, setRuleType] = useState<RuleType>('default')
  const [commission, setCommission] = useState(0)
  const [tax, setTax] = useState(0)
  const [tiers, setTiers] = useState<CommissionTier[]>([{ min: 0, max: null, percentage: 0 }])
  const [loading, setLoading] = useState(false)

  // Reset quando abre com produto diferente
  useEffect(() => {
    if (product) {
      // Determinar tipo atual
      if (product.commission_rule_id) {
        // Tem regra por faixa
        setRuleType('tiered')
        // TODO: carregar tiers da regra se necessário
        setTiers([{ min: 0, max: null, percentage: 0 }])
      } else if (product.default_commission_rate !== null && product.default_commission_rate !== undefined) {
        // Tem override fixo
        setRuleType('fixed')
        setCommission(product.default_commission_rate)
        setTax(product.default_tax_rate ?? 0)
      } else {
        // Usa padrão
        setRuleType('default')
        setCommission(supplierCommission ?? 0)
        setTax(supplierTax ?? 0)
      }
    }
  }, [product, supplierCommission, supplierTax])

  // Funções para gerenciar faixas
  function addTier() {
    const lastTier = tiers[tiers.length - 1]
    const newMin = lastTier.max ?? 0
    setTiers([
      ...tiers.slice(0, -1),
      { ...lastTier, max: newMin },
      { min: newMin, max: null, percentage: 0 },
    ])
  }

  function removeTier(index: number) {
    if (tiers.length <= 1) return
    const newTiers = tiers.filter((_, i) => i !== index)
    if (newTiers.length > 0) {
      newTiers[newTiers.length - 1].max = null
    }
    setTiers(newTiers)
  }

  function updateTier(index: number, field: keyof CommissionTier, value: number | null) {
    const newTiers = [...tiers]
    newTiers[index] = { ...newTiers[index], [field]: value }
    setTiers(newTiers)
  }

  async function handleSave() {
    if (!product) return

    setLoading(true)
    try {
      const result = await updateProductCommission(product.id, {
        type: ruleType,
        commission: ruleType === 'fixed' ? commission : undefined,
        tax: ruleType === 'fixed' ? tax : undefined,
        tiers: ruleType === 'tiered' ? tiers : undefined,
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Comissão do Produto</DialogTitle>
          <DialogDescription>
            Defina a comissão para <strong>{product?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Toggle tipo de comissão */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-muted/50 rounded-lg">
            <button
              type="button"
              onClick={() => setRuleType('default')}
              className={cn(
                'py-2.5 text-sm font-medium rounded-md transition-all',
                ruleType === 'default'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Padrão
            </button>
            <button
              type="button"
              onClick={() => setRuleType('fixed')}
              className={cn(
                'py-2.5 text-sm font-medium rounded-md transition-all',
                ruleType === 'fixed'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Fixo
            </button>
            <button
              type="button"
              onClick={() => setRuleType('tiered')}
              className={cn(
                'py-2.5 text-sm font-medium rounded-md transition-all',
                ruleType === 'tiered'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Por Faixa
            </button>
          </div>

          {/* Conteúdo baseado no tipo */}
          {ruleType === 'default' && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
              <p>Este produto usará a comissão padrão da pasta:</p>
              <p className="font-medium mt-1">
                {supplierCommission ?? 0}% comissão
                {(supplierTax ?? 0) > 0 && ` + ${supplierTax}% taxa`}
              </p>
            </div>
          )}

          {ruleType === 'fixed' && (
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

          {ruleType === 'tiered' && (
            <div className="space-y-3">
              <Label>Faixas de Comissão</Label>

              {tiers.map((tier, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Faixa {index + 1}
                    </span>
                    {tiers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-destructive hover:text-destructive"
                        onClick={() => removeTier(index)}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Mínimo (R$)</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={tier.min}
                        onChange={(e) => updateTier(index, 'min', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {index === tiers.length - 1 ? 'Máximo' : 'Máximo (R$)'}
                      </Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={tier.max ?? ''}
                        onChange={(e) =>
                          updateTier(index, 'max', e.target.value ? parseFloat(e.target.value) : null)
                        }
                        disabled={index === tiers.length - 1}
                        placeholder={index === tiers.length - 1 ? '∞' : ''}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Comissão (%)</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max="100"
                        step="0.01"
                        value={tier.percentage}
                        onChange={(e) => updateTier(index, 'percentage', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <DashedActionButton
                icon={<Plus className="h-4 w-4" />}
                onClick={addTier}
              >
                Adicionar faixa
              </DashedActionButton>

              <p className="text-xs text-muted-foreground">
                A última faixa sempre terá valor máximo ilimitado
              </p>
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
