'use client'

import { useState } from 'react'
import { Package, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown } from 'lucide-react'
import type { Product } from '@/types'

type ProductSearchPopoverProps = {
  products: Product[]
  value?: string | null
  productName?: string
  onProductSelect: (product: Product) => void
  onEditProduct?: (product: Product) => void
  onAddNewProduct?: () => void
  disabled?: boolean
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function ProductSearchPopover({
  products,
  value,
  productName,
  onProductSelect,
  onEditProduct,
  onAddNewProduct,
  disabled,
}: ProductSearchPopoverProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const displayValue = productName || ''

  function handleSelect(product: Product) {
    onProductSelect(product)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-14 w-full border-2 transition-all rounded-2xl justify-between px-4 shadow-sm bg-white text-base',
            value
              ? 'border-border'
              : 'border-border text-muted-foreground'
          )}
        >
          <span className="flex items-center gap-3 truncate">
            {displayValue ? (
              <>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-semibold text-emerald-600">
                  {getInitials(displayValue)}
                </span>
                <span className="font-semibold text-foreground truncate">{displayValue}</span>
              </>
            ) : (
              'Selecionar item...'
            )}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-3"
        align="center"
        sideOffset={6}
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar item..."
            value={search}
            onValueChange={setSearch}
            className="h-12 text-base"
          />
          <CommandList className="max-h-[300px] mt-2">
            {filteredProducts.length === 0 && (
              <CommandEmpty>
                <div className="flex flex-col items-center py-6 text-muted-foreground">
                  <Package className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">Nenhum item encontrado</p>
                </div>
              </CommandEmpty>
            )}

            {filteredProducts.length > 0 && (
              <CommandGroup className="p-0">
                {filteredProducts.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={() => handleSelect(product)}
                    className={cn(
                      'py-2.5 px-3 rounded-lg',
                      value === product.id && 'bg-accent/50'
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-semibold text-emerald-600 mr-2.5">
                      {getInitials(product.name)}
                    </span>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate font-medium">{product.name}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {product.unit_price != null && (
                          <span>R$ {product.unit_price.toFixed(2).replace('.', ',')}</span>
                        )}
                        {product.default_tax_rate != null && product.default_tax_rate > 0 && (
                          <span className="text-orange-600">{product.default_tax_rate}%</span>
                        )}
                        {product.default_commission_rate != null && product.default_commission_rate > 0 && (
                          <span className="text-green-600">{product.default_commission_rate}%</span>
                        )}
                      </div>
                    </div>
                    {onEditProduct && (
                      <button
                        type="button"
                        className="ml-2 shrink-0 p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpen(false)
                          setSearch('')
                          onEditProduct(product)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Keep backward-compatible export name
export { ProductSearchPopover as ProductSearchDialog }
