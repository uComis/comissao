'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronLeft, Package, Pencil, Plus, Search, Loader2, Check } from 'lucide-react'
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
} from '@/components/ui/item'
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
import { createPersonalSupplierWithRule, updatePersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import { toast } from 'sonner'
import { SupplierForm, type SupplierFormRef } from './supplier-form'
import { SupplierDialog } from './supplier-dialog'
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
  onSupplierCreated?: (supplier: PersonalSupplierWithRules) => void
  onAddClick?: () => void
  placeholder?: string
  className?: string
}

export function SupplierPicker({
  suppliers,
  value,
  onChange,
  onSupplierCreated,
  onAddClick,
  placeholder = 'Selecione a pasta',
  className,
}: Props) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Mobile sliding state
  const [view, setView] = useState<'list' | 'form'>('list')
  const supplierFormRef = useRef<SupplierFormRef>(null)
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Desktop dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogEditingSupplier, setDialogEditingSupplier] = useState<PersonalSupplierWithRules | null>(null)

  const selectedSupplier = suppliers.find((s) => s.id === value)
  const displayValue = selectedSupplier?.name || ''

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  // Reset view when opens
  useEffect(() => {
    if (open) {
      setView('list')
      setSearch('')
      resetForm()
    }
  }, [open])

  function resetForm() {
    setEditingSupplierId(null)
    supplierFormRef.current?.reset()
    setLoading(false)
  }

  function handleSelect(supplierId: string) {
    onChange(supplierId)
    setOpen(false)
    setSearch('')
  }

  // --- Mobile handlers ---
  function handleNavigateToForm(supplier?: PersonalSupplierWithRules) {
    if (supplier) {
      setEditingSupplierId(supplier.id)
      supplierFormRef.current?.reset({ name: supplier.name, cnpj: supplier.cnpj || '' })
    } else {
      setEditingSupplierId(null)
      supplierFormRef.current?.reset({ name: search.trim() || '' })
    }
    setView('form')
  }

  function handleBack() {
    setView('list')
    resetForm()
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()

    if (!supplierFormRef.current?.validate()) {
      toast.error('Nome é obrigatório')
      return
    }

    setLoading(true)

    try {
      const data = supplierFormRef.current.getData()

      if (editingSupplierId) {
        const result = await updatePersonalSupplierWithRules(editingSupplierId, {
          name: data.name,
          cnpj: data.cnpj,
        })

        if (result.success) {
          toast.success('Fornecedor atualizado')
          onSupplierCreated?.(result.data)
          onChange(result.data.id)
          setOpen(false)
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createPersonalSupplierWithRule({
          name: data.name,
          cnpj: data.cnpj,
          rule: null,
        })

        if (result.success) {
          toast.success('Fornecedor criado')
          onSupplierCreated?.(result.data)
          onChange(result.data.id)
          setOpen(false)
        } else {
          toast.error(result.error)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // --- Desktop dialog handlers ---
  function handleDialogOpen(supplier: PersonalSupplierWithRules) {
    setDialogEditingSupplier(supplier)
    setOpen(false)
    setSearch('')
    setDialogOpen(true)
  }

  function handleAddNew() {
    setDialogEditingSupplier(null)
    setOpen(false)
    setSearch('')
    if (onAddClick) {
      onAddClick()
    } else {
      setDialogOpen(true)
    }
  }

  function handleDialogSuccess(supplier: PersonalSupplierWithRules) {
    onSupplierCreated?.(supplier)
    onChange(supplier.id)
  }

  // --- Mobile: Sheet with sliding content ---
  if (isMobile) {
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
                          handleNavigateToForm(supplier)
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
      </>
    )

    const formContent = (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto px-5 py-4">
          <SupplierForm
            ref={supplierFormRef}
            autoFocus={false}
          />
        </div>
      </div>
    )

    const renderSlidingContent = (containerClass: string) => (
      <div className={cn("flex flex-col", containerClass)}>
        <div className="relative flex-1 overflow-hidden">
          <div
            className="flex h-full w-[200%] transition-transform duration-300 ease-in-out"
            style={{ transform: view === 'form' ? 'translateX(-50%)' : 'translateX(0)' }}
          >
            <div className="w-1/2 flex flex-col h-full overflow-hidden">
              {listContent}
            </div>
            <div className="w-1/2 flex flex-col h-full overflow-hidden">
              {formContent}
            </div>
          </div>
        </div>
        <div className="shrink-0 p-4 border-t">
          {view === 'list' ? (
            <Button
              type="button"
              onClick={() => handleNavigateToForm()}
              variant="outline"
              className="w-full h-12 gap-2 font-medium"
            >
              <Plus className="h-4 w-4" />
              Adicionar Fornecedor
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-12 font-medium"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={loading}
                className="flex-1 h-12 gap-2 font-medium bg-foreground text-background hover:bg-foreground/90"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Salvar
              </Button>
            </div>
          )}
        </div>
      </div>
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

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-full h-full flex flex-col p-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <SheetHeader className="h-[60px] shrink-0 flex flex-row items-center px-5 text-left">
              <SheetTitle className="text-lg flex items-center gap-2">
                {view === 'form' && (
                  <button type="button" onClick={handleBack} className="hover:opacity-70 transition-opacity">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                {view === 'list' ? 'Selecionar Fornecedor' : editingSupplierId ? 'Editar Pasta' : 'Nova Pasta'}
              </SheetTitle>
            </SheetHeader>
            {renderSlidingContent("flex-1")}
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // --- Desktop: Combobox select + SupplierDialog modal ---
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
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
        </PopoverTrigger>
        <PopoverContent
          className="p-3"
          align="center"
          sideOffset={6}
          style={{ width: 'var(--radix-popover-trigger-width)' }}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar fornecedor..."
              value={search}
              onValueChange={setSearch}
              className="h-12 text-base"
            />
            <CommandList className="max-h-[300px] mt-2">
              {filteredSuppliers.length === 0 && (
                <CommandEmpty>
                  <div className="flex flex-col items-center py-6 text-muted-foreground">
                    <Package className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">Nenhum registro encontrado</p>
                  </div>
                </CommandEmpty>
              )}

              {filteredSuppliers.length > 0 && (
                <CommandGroup className="p-0">
                  {filteredSuppliers.map((supplier) => (
                    <CommandItem
                      key={supplier.id}
                      value={supplier.id}
                      onSelect={() => handleSelect(supplier.id)}
                      className={cn(
                        'py-2.5 px-3 rounded-lg',
                        value === supplier.id && 'bg-accent/50'
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#409eff]/15 text-[11px] font-semibold text-[#409eff] mr-2.5">
                        {getInitials(supplier.name)}
                      </span>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate font-medium">{supplier.name}</span>
                        {supplier.cnpj && (
                          <span className="text-xs text-muted-foreground">
                            CNPJ: {supplier.cnpj}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="ml-2 shrink-0 p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDialogOpen(supplier)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSuccess}
        editingSupplier={dialogEditingSupplier}
      />
    </>
  )
}
