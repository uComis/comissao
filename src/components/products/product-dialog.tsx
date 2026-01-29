'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createProduct, updateProduct } from '@/app/actions/products'
import { toast } from 'sonner'
import type { Product, CommissionRule } from '@/types'
import { ProductForm, type ProductFormRef } from './product-form'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierId: string
  product?: Product | null
  showSku?: boolean
  initialName?: string
  onProductCreated?: (product: Product) => void
  availableRules?: CommissionRule[]
  existingProducts?: Product[]
  onAddRule?: () => void
}

export function ProductDialog({
  open,
  onOpenChange,
  supplierId,
  product,
  showSku = true,
  initialName,
  onProductCreated,
  availableRules,
  existingProducts,
  onAddRule
}: Props) {
  const formRef = useRef<ProductFormRef>(null)
  const [loading, setLoading] = useState(false)

  const isEditing = !!product

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!formRef.current?.validate()) {
      return
    }

    setLoading(true)

    try {
      const formData = formRef.current.getData()

      if (isEditing && product) {
        const result = await updateProduct(product.id, {
          name: formData.name,
          sku: formData.sku,
          unit_price: formData.unit_price,
          default_commission_rate: formData.default_commission_rate,
          default_tax_rate: formData.default_tax_rate,
          commission_rule_id: formData.commission_rule_id,
        })

        if (result.success) {
          toast.success('Produto atualizado')
          formRef.current?.reset()
          onOpenChange(false)
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createProduct({
          personal_supplier_id: supplierId,
          name: formData.name,
          sku: formData.sku ?? undefined,
          unit_price: formData.unit_price,
          default_commission_rate: formData.default_commission_rate,
          default_tax_rate: formData.default_tax_rate,
          commission_rule_id: formData.commission_rule_id,
        })

        if (result.success) {
          toast.success('Produto criado')
          formRef.current?.reset()
          onProductCreated?.(result.data)
          onOpenChange(false)
        } else {
          toast.error(result.error)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      formRef.current?.reset()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="top-[20%] translate-y-0 max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle>{isEditing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing ? 'Edite os dados do produto' : 'Cadastre um novo produto'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ProductForm
            ref={formRef}
            product={product}
            showSku={showSku}
            initialName={initialName}
            availableRules={availableRules}
            existingProducts={existingProducts}
            onAddRule={onAddRule}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
