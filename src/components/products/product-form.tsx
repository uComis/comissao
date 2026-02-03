'use client'

import { forwardRef, useImperativeHandle, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import type { Product } from '@/types'

export type ProductFormData = {
  name: string
  sku: string | null
  unit_price: number | null
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
}

export const ProductForm = forwardRef<ProductFormRef, Props>(
  function ProductForm({ product, showSku = true, initialName, autoFocus = true }, ref) {
    const [name, setName] = useState(product?.name || initialName || '')
    const [sku, setSku] = useState(product?.sku || '')
    const [unitPrice, setUnitPrice] = useState(
      product?.unit_price != null ? String(product.unit_price) : ''
    )
    const [errors, setErrors] = useState<Record<string, string>>({})

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
        }
      },
      reset() {
        setName('')
        setSku('')
        setUnitPrice('')
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

              <p className="text-xs text-muted-foreground">
                Você pode ajustar esses valores depois.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    )
  }
)
