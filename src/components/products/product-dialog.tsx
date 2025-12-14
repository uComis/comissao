'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createProduct, updateProduct } from '@/app/actions/products'
import { toast } from 'sonner'
import type { Product } from '@/types'
import { ProductForm, type ProductFormRef } from './product-form'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  showSku?: boolean
}

export function ProductDialog({ open, onOpenChange, product, showSku = true }: Props) {
  const formRef = useRef<ProductFormRef>(null)
  const [loading, setLoading] = useState(false)

  const isEditing = !!product

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

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
          name: formData.name,
          sku: formData.sku ?? undefined,
          unit_price: formData.unit_price,
        })

        if (result.success) {
          toast.success('Produto criado')
          formRef.current?.reset()
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ProductForm ref={formRef} product={product} showSku={showSku} />

          <DialogFooter>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
