'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Package } from 'lucide-react'
import { ProductTable, ProductDialog } from '@/components/products'
import type { Product } from '@/types'

type Props = {
  initialProducts: Product[]
}

export function ProdutosClient({ initialProducts }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const hasProducts = initialProducts.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meus Produtos</h1>
          <p className="text-muted-foreground">Produtos que você representa e vende</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {hasProducts ? (
        <ProductTable products={initialProducts} showSku={false} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="font-semibold">Nenhum produto cadastrado</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Adicione os produtos que você representa para facilitar o registro de vendas.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Produto
            </Button>
          </CardContent>
        </Card>
      )}

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        showSku={false}
      />
    </div>
  )
}
