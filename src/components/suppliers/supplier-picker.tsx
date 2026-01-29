'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, ChevronLeft, Package, Plus, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
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
import { RuleForm, type RuleFormRef } from '@/components/rules'
import { createPersonalSupplierWithRule } from '@/app/actions/personal-suppliers'
import { toast } from 'sonner'
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
  placeholder?: string
  className?: string
}

export function SupplierPicker({
  suppliers,
  value,
  onChange,
  onSupplierCreated,
  placeholder = 'Selecione a pasta',
  className,
}: Props) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'form'>('list')

  // Form state
  const ruleFormRef = useRef<RuleFormRef>(null)
  const [formName, setFormName] = useState('')
  const [formCnpj, setFormCnpj] = useState('')
  const [hasCommission, setHasCommission] = useState(false)
  const [loading, setLoading] = useState(false)

  const selectedSupplier = suppliers.find((s) => s.id === value)
  const displayValue = selectedSupplier?.name || ''

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  // Reset to list view whenever modal opens or closes
  useEffect(() => {
    if (open) {
      // Immediately show list on open
      setView('list')
      setSearch('')
      resetForm()
    }
  }, [open])

  function resetForm() {
    setFormName('')
    setFormCnpj('')
    setHasCommission(false)
    setLoading(false)
  }

  function handleSelect(supplierId: string) {
    onChange(supplierId)
    setOpen(false)
    setSearch('')
  }

  function handleNavigateToForm(initialName?: string) {
    setFormName(initialName || search.trim() || '')
    setFormCnpj('')
    setHasCommission(false)
    setView('form')
  }

  function handleBack() {
    setView('list')
    resetForm()
  }

  function formatCnpj(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()

    if (!formName.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    if (hasCommission && !ruleFormRef.current?.validate()) {
      toast.error('Configure a regra de comissão')
      return
    }

    setLoading(true)

    try {
      const ruleData = hasCommission && ruleFormRef.current ? ruleFormRef.current.getData() : null
      const cleanCnpj = formCnpj.replace(/\D/g, '') || undefined

      const result = await createPersonalSupplierWithRule({
        name: formName,
        cnpj: cleanCnpj,
        rule: ruleData ? {
          name: ruleData.name || `${formName} - Regra`,
          type: ruleData.type,
          target: ruleData.target,
          percentage: ruleData.percentage,
          tiers: ruleData.tiers,
          is_default: ruleData.is_default,
        } : null,
      })

      if (result.success) {
        toast.success('Fornecedor criado')
        onSupplierCreated?.(result.data)
        // Auto-select and go back to list
        onChange(result.data.id)
        setOpen(false)
      } else {
        toast.error(result.error)
      }
    } finally {
      setLoading(false)
    }
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
                        handleNavigateToForm(supplier.name)
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
      <form onSubmit={handleSubmit} className="flex-1 overflow-auto px-5 py-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="picker-supplier-name">Nome da Empresa/Fábrica *</Label>
          <Input
            id="picker-supplier-name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Ex: Tintas Coral"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="picker-supplier-cnpj">CNPJ</Label>
          <Input
            id="picker-supplier-cnpj"
            value={formCnpj}
            onChange={(e) => setFormCnpj(formatCnpj(e.target.value))}
            placeholder="00.000.000/0000-00"
          />
          <p className="text-muted-foreground text-xs">Opcional.</p>
        </div>

        <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Regra de Comissão</Label>
              <p className="text-sm text-muted-foreground">
                Opcional. Você pode configurar depois.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="picker-has-commission"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={hasCommission}
                onChange={(e) => setHasCommission(e.target.checked)}
              />
              <Label htmlFor="picker-has-commission" className="font-normal cursor-pointer">
                Configurar agora
              </Label>
            </div>
          </div>

          {hasCommission && (
            <div className="pt-2 border-t mt-2">
              <RuleForm
                ref={ruleFormRef}
                showName={false}
                showDefault={false}
              />
            </div>
          )}
        </div>

      </form>
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

      {isMobile ? (
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
                {view === 'list' ? 'Selecionar Fornecedor' : 'Nova Pasta'}
              </SheetTitle>
            </SheetHeader>
            {renderSlidingContent("flex-1")}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md p-0 gap-0 overflow-hidden [&>[data-slot=dialog-close]]:top-[22px]" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="h-[60px] shrink-0 flex flex-row items-center px-5 text-left">
              <DialogTitle className="text-lg flex items-center gap-2">
                {view === 'form' && (
                  <button type="button" onClick={handleBack} className="hover:opacity-70 transition-opacity">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                {view === 'list' ? 'Selecionar Fornecedor' : 'Nova Pasta'}
              </DialogTitle>
            </DialogHeader>
            {renderSlidingContent("h-[60vh]")}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
