import { Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter as SheetFooterUI,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CompactNumberInput } from '@/components/ui/compact-number-input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { cn } from '@/lib/utils'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

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
  onProductSearchClick: () => void
  onUpdateEntry: (id: string, field: keyof Omit<ValueEntry, 'id'>, value: string | number) => void
  onDeleteEntry: (id: string) => void
}

export function MobileItemDrawer({
  open,
  onOpenChange,
  entry,
  informItems,
  supplierId,
  onProductSearchClick,
  onUpdateEntry,
  onDeleteEntry,
}: MobileItemDrawerProps) {
  if (!entry) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'w-full h-full p-0 flex flex-col overflow-hidden transition-all duration-300'
        )}
      >
        <SheetHeader className="p-6 pb-2 border-b">
          <SheetTitle className="text-xl font-bold">
            {entry.productName || entry.grossValue ? 'Editar Item' : 'Adicionar Item'}
          </SheetTitle>
        </SheetHeader>

        <div
          className={cn(
            'flex-1 overflow-y-auto p-6 space-y-6 pb-24',
            !informItems && 'flex flex-col items-center justify-start pt-[12vh]'
          )}
        >
          <div className="space-y-6">
            {informItems && (
              <div className="space-y-3 w-full">
                <Label className="text-[13px] text-foreground/70 font-bold mb-1 block px-1">
                  Item
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'h-14 w-full border-2 transition-all rounded-2xl justify-between px-4 shadow-sm bg-white text-base',
                    entry.productId
                      ? 'border-border'
                      : 'border-dashed border-primary/30 text-muted-foreground'
                  )}
                  onClick={() => {
                    if (!supplierId) {
                      toast.error('Selecione um fornecedor primeiro')
                      return
                    }
                    onProductSearchClick()
                  }}
                >
                  <span className="truncate font-semibold">
                    {entry.productName || 'Selecionar item...'}
                  </span>
                  <Search className="h-5 w-5 shrink-0 opacity-50" />
                </Button>
              </div>
            )}

            {/* Qntd e Preço em 2 colunas ou Preço Único */}
            <div className={cn('grid gap-6 w-full', informItems ? 'grid-cols-2' : 'grid-cols-1')}>
              {informItems && (
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
              )}
              <div
                className={cn(
                  'space-y-3 transition-all duration-300',
                  !informItems && 'max-w-[280px] mx-auto w-full text-center'
                )}
              >
                <Label
                  className={cn(
                    'text-[13px] font-bold mb-1 block px-1',
                    informItems
                      ? 'text-foreground/70'
                      : 'text-primary text-base uppercase tracking-wider'
                  )}
                >
                  {informItems ? 'Preço Unitário' : 'Valor Total'}
                </Label>
                <CurrencyInput
                  placeholder="0,00"
                  value={entry.grossValue || ''}
                  onChange={(val) => onUpdateEntry(entry.id, 'grossValue', val)}
                  className={cn(
                    'font-bold transition-all duration-300',
                    informItems
                      ? 'h-14 text-lg'
                      : 'h-20 text-3xl text-center rounded-3xl border-primary/20 shadow-xl shadow-primary/5 focus-visible:border-primary focus-visible:ring-primary/10'
                  )}
                />
              </div>
            </div>

            {/* Info Totalizador no Drawer (Apenas se Detalhado) */}
            {informItems && (
              <div className="bg-muted/30 rounded-2xl p-4 flex justify-between items-center border border-dashed mt-4">
                <span className="text-[13px] font-bold text-foreground/60 transition-colors">
                  Subtotal do Item
                </span>
                <span className="text-xl font-bold text-primary">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format((entry.quantity || 0) * (parseFloat(entry.grossValue || '0') || 0))}
                </span>
              </div>
            )}

            {/* Impostos e Comissão */}
            <div
              className={cn(
                'grid gap-6 pt-2 w-full transition-all duration-300',
                informItems
                  ? 'grid-cols-2'
                  : 'grid-cols-1 max-w-[280px] mx-auto bg-muted/20 p-6 rounded-[3rem] border border-dashed'
              )}
            >
              <div className="space-y-3">
                <Label
                  className={cn(
                    'text-muted-foreground font-semibold flex items-center gap-2 px-1',
                    informItems ? 'text-[10px]' : 'text-[11px] justify-center'
                  )}
                >
                  {!informItems && (
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  )}
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
                  className={cn(
                    'font-bold transition-all',
                    informItems ? 'h-14 text-lg' : 'h-16 text-xl bg-white border-2'
                  )}
                />
              </div>
              <div className="space-y-3">
                <Label
                  className={cn(
                    'text-muted-foreground font-semibold flex items-center gap-2 px-1',
                    informItems ? 'text-[10px]' : 'text-[11px] justify-center'
                  )}
                >
                  {!informItems && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  )}
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
                  className={cn(
                    'font-bold transition-all',
                    informItems ? 'h-14 text-lg' : 'h-16 text-xl bg-white border-2'
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <SheetFooterUI className="p-6 border-t bg-background sticky bottom-0 mt-autos">
          <div className="flex gap-3 w-full">
            <Button
              variant="destructive"
              onClick={() => {
                onDeleteEntry(entry.id)
                onOpenChange(false)
              }}
              className="h-14 rounded-2xl text-base font-bold flex-1"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Excluir
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              className="h-14 rounded-2xl text-base font-bold shadow-lg flex-1"
            >
              Confirmar
            </Button>
          </div>
        </SheetFooterUI>
      </SheetContent>
    </Sheet>
  )
}
