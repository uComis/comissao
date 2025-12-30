'use client'

import { useState } from 'react'
import { Check, ChevronDown, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import type { Product } from '@/types'

type Props = {
  products: Product[]
  value: string | null
  onChange: (productId: string | null, productName: string, unitPrice?: number) => void
  onAddClick: (initialName?: string) => void
  placeholder?: string
  className?: string
}

export function ProductPicker({
  products,
  value,
  onChange,
  onAddClick,
  placeholder = 'Selecionar produto...',
  className,
}: Props) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedProduct = products.find((p) => p.id === value)
  const displayValue = selectedProduct?.name || ''

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(product: Product) {
    onChange(product.id, product.name, product.unit_price ?? undefined)
    setOpen(false)
    setSearch('')
  }

  function handleAddNew() {
    const nameToPass = search.trim() || undefined
    setOpen(false)
    setSearch('')
    onAddClick(nameToPass)
  }

  function handleUseCustomName() {
    onChange(null, search.trim())
    setOpen(false)
    setSearch('')
  }

  // Mobile: Sheet fullscreen
  if (isMobile) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          onClick={() => setOpen(true)}
          className={cn(
            'h-12 justify-between font-normal w-full',
            !displayValue && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{displayValue || placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent 
            side="right" 
            className="w-full sm:max-w-full h-full flex flex-col p-0"
          >
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle>Selecionar Produto</SheetTitle>
            </SheetHeader>

            {/* Search Input */}
            <div className="px-4 py-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-12"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto">
              {/* Quando não encontra nada na busca */}
              {search && filteredProducts.length === 0 ? (
                <div className="flex flex-col">
                  {/* Usar nome digitado */}
                  <button
                    type="button"
                    onClick={handleUseCustomName}
                    className="w-full px-4 py-4 text-left flex items-center gap-3 hover:bg-muted transition-colors border-b"
                  >
                    <Check className="h-5 w-5 text-primary opacity-0" />
                    <span>Usar &quot;{search}&quot;</span>
                  </button>
                  
                  {/* Cadastrar produto */}
                  <button
                    type="button"
                    onClick={handleAddNew}
                    className="w-full px-4 py-4 text-left flex items-center gap-3 hover:bg-muted transition-colors text-primary font-medium"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Cadastrar &quot;{search}&quot;</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Novo Produto - sempre visível no topo */}
                  <button
                    type="button"
                    onClick={handleAddNew}
                    className="w-full px-4 py-4 text-left flex items-center gap-3 hover:bg-muted transition-colors border-b text-primary"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Novo Produto</span>
                  </button>

                  {/* Lista de produtos */}
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelect(product)}
                      className={cn(
                        'w-full px-4 py-4 text-left flex items-center gap-3 hover:bg-muted transition-colors border-b',
                        value === product.id && 'bg-muted'
                      )}
                    >
                      <Check
                        className={cn(
                          'h-5 w-5 text-primary shrink-0',
                          value === product.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium truncate">{product.name}</span>
                        {product.sku && (
                          <span className="text-xs text-muted-foreground">
                            SKU: {product.sku}
                          </span>
                        )}
                      </div>
                      {product.unit_price != null && (
                        <span className="text-sm text-muted-foreground shrink-0">
                          {new Intl.NumberFormat('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          }).format(product.unit_price)}
                        </span>
                      )}
                    </button>
                  ))}
                </>
              )}

              {filteredProducts.length === 0 && !search && (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum produto cadastrado
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Desktop: Combobox + Button
  return (
    <div className={cn('flex gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between font-normal"
          >
            <span className={cn('truncate', !displayValue && 'text-muted-foreground')}>
              {displayValue || placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[280px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Pesquisar produto..."
              value={search}
              onValueChange={setSearch}
              className="h-12"
            />
            <CommandList className="max-h-[300px]">
              {filteredProducts.length === 0 && !search && (
                <CommandEmpty>Nenhum produto cadastrado</CommandEmpty>
              )}
              
              {/* Quando não encontra - mostra opções */}
              {search && filteredProducts.length === 0 && (
                <CommandGroup className="p-2">
                  <CommandItem onSelect={handleUseCustomName} className="py-3 px-3 rounded-md">
                    <span>Usar &quot;{search}&quot;</span>
                  </CommandItem>
                  <CommandItem onSelect={handleAddNew} className="py-3 px-3 rounded-md text-primary">
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Cadastrar &quot;{search}&quot;</span>
                  </CommandItem>
                </CommandGroup>
              )}
              
              {filteredProducts.length > 0 && (
                <CommandGroup className="p-2">
                  {filteredProducts.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.id}
                      onSelect={() => handleSelect(product)}
                      className="py-3 px-3 rounded-md"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 shrink-0',
                          value === product.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate">{product.name}</span>
                        {product.sku && (
                          <span className="text-xs text-muted-foreground">
                            SKU: {product.sku}
                          </span>
                        )}
                      </div>
                      {product.unit_price != null && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Intl.NumberFormat('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          }).format(product.unit_price)}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onAddClick()}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}

