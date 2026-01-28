'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronDown, Plus, Search, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { getBlockedSuppliers } from '@/app/actions/billing'
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

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-full h-full flex flex-col p-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
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

  // Desktop: Select (sem botão "+")
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn('!h-[60px] rounded-xl bg-muted/30', className)}>
        <SelectValue placeholder={placeholder}>
          {displayValue && (
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#409eff]/15 text-sm font-semibold text-[#409eff]">
                {getInitials(displayValue)}
              </span>
              <span className="font-medium">{displayValue}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {suppliers.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Nenhum fornecedor encontrado
          </div>
        ) : (
          suppliers.map((supplier) => (
            <SelectItem key={supplier.id} value={supplier.id}>
              {supplier.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
