import { Minus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CompactNumberInput } from '@/components/ui/compact-number-input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { ProductSearchPopover } from './product-search-dialog'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

type ValueEntry = {
  id: string
  quantity: number
  grossValue: string
  taxRate: string
  commissionRate: string
  productId?: string | null
  productName?: string
}

type MobileItemDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: ValueEntry | null
  informItems: boolean
  supplierId: string
  products: Product[]
  onProductSelect: (product: Product) => void
  onEditProduct?: (product: Product) => void
  onUpdateEntry: (id: string, field: keyof Omit<ValueEntry, 'id'>, value: string | number) => void
  onDeleteEntry: (id: string) => void
}

function ItemFormContent({
  entry,
  informItems,
  supplierId,
  products,
  onProductSelect,
  onEditProduct,
  onUpdateEntry,
}: Pick<MobileItemDrawerProps, 'entry' | 'informItems' | 'supplierId' | 'products' | 'onProductSelect' | 'onEditProduct' | 'onUpdateEntry'>) {
  if (!entry) return null

  return (
    <div className="space-y-6">
      {informItems && (
        <div className="space-y-3 w-full">
          <Label className="text-[13px] text-foreground/70 font-bold mb-1 block px-1">
            Item
          </Label>
          {!supplierId ? (
            <Button
              type="button"
              variant="outline"
              disabled
              className="h-14 w-full border-2 border-dashed border-primary/30 text-muted-foreground rounded-2xl justify-between px-4 shadow-sm bg-white text-base"
              onClick={() => toast.error('Selecione um fornecedor primeiro')}
            >
              <span className="truncate font-semibold">Selecionar item...</span>
            </Button>
          ) : (
            <ProductSearchPopover
              products={products}
              value={entry.productId}
              productName={entry.productName}
              onProductSelect={onProductSelect}
              onEditProduct={onEditProduct}
              disabled={!supplierId}
            />
          )}
        </div>
      )}

      {informItems ? (
        <>
          <div className="grid grid-cols-2 gap-6 w-full">
            <div className="space-y-3">
              <Label className="text-[13px] text-foreground/70 font-bold mb-1 block px-1">
                Quantidade
              </Label>
              <CompactNumberInput
                value={entry.quantity || 1}
                onChange={(val) => onUpdateEntry(entry.id, 'quantity', val)}
                min={1}
                step={1}
                decimals={0}
                className="h-14 text-lg font-bold"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[13px] text-foreground/70 font-bold mb-1 block px-1">
                Preço Unitário
              </Label>
              <CurrencyInput
                placeholder="0,00"
                value={entry.grossValue || ''}
                onChange={(val) => onUpdateEntry(entry.id, 'grossValue', val)}
                className="h-14 text-lg font-bold"
              />
            </div>
          </div>

          <div className="bg-muted/30 rounded-2xl p-4 flex justify-between items-center border border-dashed">
            <span className="text-[13px] font-bold text-foreground/60">
              Subtotal do Item
            </span>
            <span className="text-xl font-bold text-primary">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format((entry.quantity || 0) * (parseFloat(entry.grossValue || '0') || 0))}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 w-full">
            <div className="space-y-3">
              <Label className="text-[10px] text-muted-foreground font-semibold flex items-center gap-2 px-1">
                Impostos
              </Label>
              <CompactNumberInput
                value={parseFloat(entry.taxRate || '0')}
                onChange={(val) => onUpdateEntry(entry.id, 'taxRate', String(val))}
                min={0}
                max={100}
                step={0.5}
                decimals={2}
                suffix="%"
                accentColor="#f59e0b"
                className="h-14 text-lg font-bold"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] text-muted-foreground font-semibold flex items-center gap-2 px-1">
                Comissão
              </Label>
              <CompactNumberInput
                value={parseFloat(entry.commissionRate || '0')}
                onChange={(val) => onUpdateEntry(entry.id, 'commissionRate', String(val))}
                min={0}
                max={100}
                step={0.5}
                decimals={2}
                suffix="%"
                accentColor="#67C23A"
                className="h-14 text-lg font-bold"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Hero value — inspired by shadcn drawer */}
          {(() => {
            // Calcula tamanho do display formatado (ex: "1.000.000,50" = 12 chars)
            const raw = entry.grossValue || ''
            const num = parseFloat(raw) || 0
            const formatted = num.toLocaleString('pt-BR', {
              minimumFractionDigits: raw.includes('.') ? raw.split('.')[1]?.length || 0 : 0,
              maximumFractionDigits: 2,
            })
            const len = Math.max(formatted.length, 1)

            const heroSize =
              len <= 5
                ? 'text-6xl md:text-7xl'
                : len <= 8
                  ? 'text-5xl md:text-6xl'
                  : len <= 11
                    ? 'text-4xl md:text-5xl'
                    : 'text-3xl md:text-4xl'

            return (
              <div className="flex flex-col items-center py-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      const current = parseFloat(entry.grossValue || '0') || 0
                      const newVal = Math.max(0, current - 100)
                      onUpdateEntry(entry.id, 'grossValue', String(newVal))
                    }}
                    className="size-10 rounded-full border-2 border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors shrink-0"
                  >
                    <Minus className="size-4" />
                  </button>
                  <CurrencyInput
                    placeholder="0,00"
                    hidePrefix
                    value={entry.grossValue || ''}
                    onChange={(val) => onUpdateEntry(entry.id, 'grossValue', val)}
                    className={cn(
                      'h-auto border-0 shadow-none bg-transparent font-black text-center p-0 focus-visible:ring-0 transition-[font-size] duration-200',
                      heroSize
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const current = parseFloat(entry.grossValue || '0') || 0
                      onUpdateEntry(entry.id, 'grossValue', String(current + 100))
                    }}
                    className="size-10 rounded-full border-2 border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors shrink-0"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-1">
                  Reais / R$
                </span>
              </div>
            )
          })()}

          {/* Impostos + Comissão inline */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mx-auto">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                Impostos
              </Label>
              <CompactNumberInput
                value={parseFloat(entry.taxRate || '0')}
                onChange={(val) => onUpdateEntry(entry.id, 'taxRate', String(val))}
                min={0}
                max={100}
                step={0.5}
                decimals={2}
                suffix="%"
                accentColor="#f59e0b"
                className="h-11 text-sm font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Comissão
              </Label>
              <CompactNumberInput
                value={parseFloat(entry.commissionRate || '0')}
                onChange={(val) => onUpdateEntry(entry.id, 'commissionRate', String(val))}
                min={0}
                max={100}
                step={0.5}
                decimals={2}
                suffix="%"
                accentColor="#67C23A"
                className="h-11 text-sm font-bold"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ItemFormFooter({
  entry,
  onDeleteEntry,
  onOpenChange,
  isDialog,
}: {
  entry: ValueEntry
  onDeleteEntry: (id: string) => void
  onOpenChange: (open: boolean) => void
  isDialog?: boolean
}) {
  return (
    <div className={cn('flex gap-3 w-full', isDialog && 'pt-4')}>
      <Button
        variant="destructive"
        onClick={() => {
          onDeleteEntry(entry.id)
          onOpenChange(false)
        }}
        className={cn(
          'rounded-2xl font-bold flex-1',
          isDialog ? 'h-10 text-sm' : 'h-12 md:h-10 text-base md:text-sm'
        )}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Excluir
      </Button>
      <Button
        onClick={() => onOpenChange(false)}
        className={cn(
          'rounded-2xl font-bold shadow-lg flex-1',
          isDialog ? 'h-10 text-sm' : 'h-12 md:h-10 text-base md:text-sm'
        )}
      >
        Confirmar
      </Button>
    </div>
  )
}

export function MobileItemDrawer({
  open,
  onOpenChange,
  entry,
  informItems,
  supplierId,
  products,
  onProductSelect,
  onEditProduct,
  onUpdateEntry,
  onDeleteEntry,
}: MobileItemDrawerProps) {
  if (!entry) return null

  const isEditing = !!(entry.productName || entry.grossValue)

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="p-0 flex flex-col overflow-hidden max-h-[85vh]">
        <div className="mx-auto w-full max-w-lg flex flex-col flex-1 overflow-hidden">
          <DrawerHeader className="p-6 pb-2">
            <DrawerTitle>{isEditing ? 'Editar Valor' : 'Valor'}</DrawerTitle>
            <DrawerDescription>
              {informItems ? 'Informe os dados do item vendido.' : 'Informe o valor e seus percentuais.'}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
            <ItemFormContent
              entry={entry}
              informItems={informItems}
              supplierId={supplierId}
              products={products}
              onProductSelect={onProductSelect}
              onEditProduct={onEditProduct}
              onUpdateEntry={onUpdateEntry}
            />
          </div>

          <div className="p-6 border-t bg-background">
            <ItemFormFooter
              entry={entry}
              onDeleteEntry={onDeleteEntry}
              onOpenChange={onOpenChange}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
