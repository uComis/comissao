'use client'

import { forwardRef, useImperativeHandle, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
}

export const ProductForm = forwardRef<ProductFormRef, Props>(
  function ProductForm({ product, showSku = true }, ref) {
    const [name, setName] = useState(product?.name || '')
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
      // Remove tudo que não é número ou vírgula/ponto
      const cleaned = value.replace(/[^\d.,]/g, '')
      // Substitui vírgula por ponto
      return cleaned.replace(',', '.')
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="product-name">Nome do Produto *</Label>
          <Input
            id="product-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Tinta Acrílica Premium 18L"
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {showSku && (
          <div className="space-y-2">
            <Label htmlFor="product-sku">SKU / Código</Label>
            <Input
              id="product-sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Ex: TAP-18L-001"
            />
            <p className="text-xs text-muted-foreground">
              Opcional. Código interno do produto.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="product-price">Preço de Tabela (R$)</Label>
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
          <p className="text-xs text-muted-foreground">
            Opcional. Preço de referência para cálculos.
          </p>
        </div>
      </div>
    )
  }
)
