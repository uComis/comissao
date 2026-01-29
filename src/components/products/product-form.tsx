'use client'

import { forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronDown, Plus } from 'lucide-react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Product, CommissionRule } from '@/types'

export type ProductFormData = {
  name: string
  sku: string | null
  unit_price: number | null
  default_commission_rate: number | null
  default_tax_rate: number | null
  commission_rule_id: string | null
}

export type ProductFormRef = {
  validate: () => boolean
  getData: () => ProductFormData
  reset: () => void
}

type Props = {
  product?: Product | null
  showSku?: boolean
  initialName?: string
  autoFocus?: boolean
  availableRules?: CommissionRule[]
  existingProducts?: Product[]
  onAddRule?: () => void
}

export const ProductForm = forwardRef<ProductFormRef, Props>(
  function ProductForm({ product, showSku = true, initialName, autoFocus = true, availableRules, existingProducts = [], onAddRule }, ref) {
    const [name, setName] = useState(product?.name || initialName || '')
    const [sku, setSku] = useState(product?.sku || '')
    const [unitPrice, setUnitPrice] = useState(
      product?.unit_price != null ? String(product.unit_price) : ''
    )
    const [defaultCommission, setDefaultCommission] = useState(
      product?.default_commission_rate != null ? String(product.default_commission_rate) : ''
    )
    const [defaultTax, setDefaultTax] = useState(
      product?.default_tax_rate != null ? String(product.default_tax_rate) : ''
    )
    const [commissionRuleId, setCommissionRuleId] = useState(product?.commission_rule_id || 'none')
    const [errors, setErrors] = useState<Record<string, string>>({})

    const getMostCommon = useCallback(<T,>(arr: T[]): T | null => {
        if (arr.length === 0) return null
        const counts = new Map<T, number>()
        let maxCount = 0
        let mostCommon = arr[0]

        for (const item of arr) {
            const count = (counts.get(item) || 0) + 1
            counts.set(item, count)
            if (count > maxCount) {
                maxCount = count
                mostCommon = item
            }
        }
        return mostCommon
    }, [])

    // Lógica de sugestão inteligente para novos produtos
    useEffect(() => {
      if (!product && existingProducts.length > 0) {
        const commissions = existingProducts
          .map(p => p.default_commission_rate)
          .filter((v): v is number => v !== null)

        const taxes = existingProducts
          .map(p => p.default_tax_rate)
          .filter((v): v is number => v !== null)

        const rules = existingProducts
          .map(p => p.commission_rule_id)
          .filter((v): v is string => v !== null)

        if (commissions.length > 0) {
          const mostCommon = getMostCommon(commissions)
          if (mostCommon !== null) setDefaultCommission(String(mostCommon))
        }

        if (taxes.length > 0) {
          const mostCommon = getMostCommon(taxes)
          if (mostCommon !== null) setDefaultTax(String(mostCommon))
        }

        if (rules.length > 0) {
          const mostCommon = getMostCommon(rules)
          if (mostCommon !== null) setCommissionRuleId(mostCommon)
        }
      }
    }, [product, existingProducts, getMostCommon])

    useImperativeHandle(ref, () => ({
      validate() {
        const newErrors: Record<string, string> = {}

        if (!name.trim()) {
          newErrors.name = 'Nome é obrigatório'
        }

        if (unitPrice && isNaN(parseFloat(unitPrice))) {
          newErrors.unit_price = 'Preço inválido'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
      },
      getData() {
        return {
          name: name.trim(),
          sku: sku.trim() || null,
          unit_price: unitPrice ? parseFloat(unitPrice) : null,
          default_commission_rate: defaultCommission ? parseFloat(defaultCommission) : null,
          default_tax_rate: defaultTax ? parseFloat(defaultTax) : null,
          commission_rule_id: commissionRuleId === 'none' ? null : commissionRuleId,
        }
      },
      reset() {
        setName('')
        setSku('')
        setUnitPrice('')
        setDefaultCommission('')
        setDefaultTax('')
        setCommissionRuleId('none')
        setErrors({})
      },
    }))

    function formatPrice(value: string): string {
      const cleaned = value.replace(/[^\d.,]/g, '')
      return cleaned.replace(',', '.')
    }

    return (
      <div className="space-y-6">
        {/* Campo principal */}
        <div className="space-y-1.5">
          <Label htmlFor="product-name" className="text-base font-semibold">
            Nome
          </Label>
          <Input
            id="product-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do produto"
            autoFocus={autoFocus}
            className={`h-[50px] text-base ${errors.name ? 'border-destructive' : ''}`}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Detalhes opcionais (colapsável) */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
            <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
            Detalhes opcionais
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            <div className="space-y-4 mt-3 rounded-lg bg-muted/50 p-4">
              {showSku && (
                <div className="space-y-2">
                  <Label htmlFor="product-sku" className="text-sm text-muted-foreground">SKU / Código</Label>
                  <Input
                    id="product-sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Ex: TAP-18L-001"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="product-price" className="text-sm text-muted-foreground">Preço de Tabela (R$)</Label>
                <Input
                  id="product-price"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(formatPrice(e.target.value))}
                  placeholder="0.00"
                  className={errors.unit_price ? 'border-destructive' : ''}
                />
                {errors.unit_price && (
                  <p className="text-sm text-destructive">{errors.unit_price}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-commission" className="text-sm text-muted-foreground">Comissão Padrão (%)</Label>
                  <Input
                    id="default-commission"
                    type="number"
                    step="0.01"
                    value={defaultCommission}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val !== '' && parseFloat(val) < 0) {
                        setDefaultCommission('')
                      } else {
                        setDefaultCommission(val)
                      }
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-tax" className="text-sm text-muted-foreground">Taxa Padrão (%)</Label>
                  <Input
                    id="default-tax"
                    type="number"
                    step="0.01"
                    value={defaultTax}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val !== '' && parseFloat(val) < 0) {
                        setDefaultTax('')
                      } else {
                        setDefaultTax(val)
                      }
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission-rule" className="text-sm text-muted-foreground">Regra de Faixa</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={commissionRuleId} onValueChange={setCommissionRuleId}>
                      <SelectTrigger id="commission-rule" className="w-full">
                        <SelectValue placeholder="Selecione uma regra" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem regra de faixa (usar fixo)</SelectItem>
                        {availableRules?.map(rule => (
                            <SelectItem key={rule.id} value={rule.id}>
                                {rule.name} ({rule.target === 'tax' ? 'Taxa' : 'Comissão'})
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {onAddRule && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={onAddRule}
                      title="Criar nova regra"
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Se selecionada, terá prioridade sobre o valor fixo.
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Você pode ajustar comissões e preços depois.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    )
  }
)
