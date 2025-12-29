'use client'

import { useState } from 'react'
import { Check, ChevronDown, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

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
  placeholder = 'Selecione o fornecedor',
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

  // Mobile: Drawer fullscreen
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
              <SheetTitle>Selecionar Fornecedor</SheetTitle>
            </SheetHeader>

            {/* Search Input */}
            <div className="px-4 py-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar fornecedor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-12"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto">
              {/* Create New Option */}
              {search && filteredSuppliers.length === 0 ? (
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="w-full px-4 py-4 text-left flex items-center gap-3 hover:bg-muted transition-colors text-primary font-medium"
                >
                  <Plus className="h-5 w-5" />
                  <span>Criar &quot;{search}&quot;</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleAddNew}
                    className="w-full px-4 py-4 text-left flex items-center gap-3 hover:bg-muted transition-colors border-b text-primary"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Novo Fornecedor</span>
                  </button>

                  {filteredSuppliers.map((supplier) => (
                    <button
                      key={supplier.id}
                      type="button"
                      onClick={() => handleSelect(supplier.id)}
                      className={cn(
                        'w-full px-4 py-4 text-left flex items-center gap-3 hover:bg-muted transition-colors border-b',
                        value === supplier.id && 'bg-muted'
                      )}
                    >
                      <Check
                        className={cn(
                          'h-5 w-5 text-primary shrink-0',
                          value === supplier.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">{supplier.name}</span>
                        {supplier.cnpj && (
                          <span className="text-xs text-muted-foreground">
                            CNPJ: {supplier.cnpj}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </>
              )}

              {filteredSuppliers.length === 0 && !search && (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum fornecedor cadastrado
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Desktop: Select + Button
  return (
    <div className={cn('flex gap-2', className)}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {suppliers.map((supplier) => (
            <SelectItem key={supplier.id} value={supplier.id}>
              {supplier.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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

