'use client'

import { useState } from 'react'
import { ChevronDown, Package, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
  ItemSeparator,
} from '@/components/ui/item'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

type Props = {
  suppliers: PersonalSupplierWithRules[]
  value: string
  onChange: (value: string) => void
  onAddClick: (initialName?: string) => void
  placeholder?: string
  className?: string
}

export function SupplierPicker({
  suppliers,
  value,
  onChange,
  onAddClick,
  placeholder = 'Selecione a pasta',
  className,
}: Props) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedSupplier = suppliers.find((s) => s.id === value)
  const displayValue = selectedSupplier?.name || ''

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(supplierId: string) {
    onChange(supplierId)
    setOpen(false)
    setSearch('')
  }

  function handleAddNew() {
    const nameToPass = search.trim() || undefined
    setOpen(false)
    setSearch('')
    onAddClick(nameToPass)
  }

  const listContent = (
    <>
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-[55px] shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-[200px]">
        {filteredSuppliers.length > 0 ? (
          <div className="flex flex-col gap-2 px-[25px] py-2">
            {filteredSuppliers.map((supplier) => (
                <Item
                  key={supplier.id}
                  variant="outline"
                  size="sm"
                  className={cn(
                    'cursor-pointer rounded-xl hover:bg-accent/50',
                    value === supplier.id && 'bg-accent'
                  )}
                  onClick={() => handleSelect(supplier.id)}
                >
                  <ItemMedia>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#409eff]/15 text-xs font-semibold text-[#409eff]">
                      {getInitials(supplier.name)}
                    </span>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{supplier.name}</ItemTitle>
                    {supplier.cnpj && (
                      <ItemDescription>CNPJ: {supplier.cnpj}</ItemDescription>
                    )}
                  </ItemContent>
                  <ItemActions>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpen(false)
                        onAddClick(supplier.name)
                      }}
                    >
                      Editar
                    </Button>
                  </ItemActions>
                </Item>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Nenhum registro encontrado</p>
          </div>
        )}
      </div>

      <div className="p-4">
        <Button
          type="button"
          onClick={handleAddNew}
          className="w-full h-12 gap-2 font-medium bg-foreground text-background hover:bg-foreground/90"
        >
          <Plus className="h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>
    </>
  )

  return (
    <>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        onClick={() => setOpen(true)}
        className={cn(
          'h-[60px] justify-between font-normal w-full rounded-xl bg-muted/30',
          !displayValue && 'text-muted-foreground',
          className
        )}
      >
        <span className="flex items-center gap-3 truncate">
          {displayValue ? (
            <>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#409eff]/15 text-sm font-semibold text-[#409eff]">
                {getInitials(displayValue)}
              </span>
              <span className="font-medium text-foreground">{displayValue}</span>
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-full h-full flex flex-col p-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <SheetHeader className="px-5 py-4">
              <SheetTitle className="text-lg">Selecionar Fornecedor</SheetTitle>
            </SheetHeader>
            {listContent}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
            <DialogHeader className="px-5 py-4">
              <DialogTitle className="text-lg">Selecionar Fornecedor</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col max-h-[60vh]">
              {listContent}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
