'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { createProduct, updateProduct } from '@/app/actions/products'
import { toast } from 'sonner'
import type { Product } from '@/types'
import { ProductForm, type ProductFormRef } from './product-form'
import { useIsMobile } from '@/hooks/use-mobile'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierId: string
  product?: Product | null
  showSku?: boolean
  initialName?: string
  onProductCreated?: (product: Product) => void
  onProductUpdated?: (product: Product) => void
}

export function ProductDialog({
  open,
  onOpenChange,
  supplierId,
  product,
  showSku = true,
  initialName,
  onProductCreated,
  onProductUpdated,
}: Props) {
  const formRef = useRef<ProductFormRef>(null)
  const [loading, setLoading] = useState(false)
  const isMobile = useIsMobile()

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
        })

        if (result.success) {
          toast.success('Produto atualizado')
          formRef.current?.reset()
          onProductUpdated?.(result.data)
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

  const title = isEditing ? 'Editar Produto' : 'Novo Produto'
  const description = isEditing ? 'Edite os dados do produto' : 'Cadastre um novo produto'

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>

          <form id="product-form-modal" onSubmit={handleSubmit} className="flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto px-4">
              <ProductForm
                ref={formRef}
                product={product}
                showSku={showSku}
                initialName={initialName}
              />
            </div>

            <DrawerFooter className="border-t">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
                className="w-full"
              >
                Cancelar
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="top-[20%] translate-y-0 max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ProductForm
            ref={formRef}
            product={product}
            showSku={showSku}
            initialName={initialName}
          />

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
