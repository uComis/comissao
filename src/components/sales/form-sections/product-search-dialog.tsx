import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Product } from '@/types'

type ProductSearchDialogProps = {
  open: boolean
  products: Product[]
  onOpenChange: (open: boolean) => void
  onProductSelect: (product: Product) => void
  onAddNewProduct?: () => void
}

export function ProductSearchDialog({
  open,
  products,
  onOpenChange,
  onProductSelect,
  onAddNewProduct,
}: ProductSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md w-full p-0 gap-0 overflow-hidden rounded-3xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
      <DialogHeader className="p-6 pb-0">
        <DialogTitle>Selecionar Item</DialogTitle>
        <div className="relative mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-12 border-2 rounded-xl"
            />
          </div>
          {onAddNewProduct && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={onAddNewProduct}
              className="h-12 w-12 shrink-0 border-2 border-primary/30 hover:border-primary rounded-xl"
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>
      </DialogHeader>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="grid gap-2">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                className="flex items-start justify-between p-4 hover:bg-muted rounded-2xl transition-colors border-2 border-transparent hover:border-primary/20 text-left"
                onClick={() => onProductSelect(product)}
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-bold text-foreground truncate">{product.name}</span>
                  {product.unit_price && (
                    <span className="text-xs text-muted-foreground mt-1">
                      Preço: R$ {product.unit_price.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  {product.default_tax_rate !== null && product.default_tax_rate !== undefined && product.default_tax_rate > 0 && (
                    <span className="text-sm font-bold text-orange-600">
                      {product.default_tax_rate}%
                    </span>
                  )}
                  {product.default_commission_rate !== null && product.default_commission_rate !== undefined && product.default_commission_rate > 0 && (
                    <span className="text-sm font-bold text-green-600">
                      {product.default_commission_rate}%
                    </span>
                  )}
                </div>
              </button>
            ))}

            {filteredProducts.length === 0 && (
              <div className="py-12 text-center text-muted-foreground italic">
                Nenhum item encontrado para este fornecedor.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/20 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl h-12 font-bold border-2"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
