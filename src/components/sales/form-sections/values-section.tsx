import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { PersonalSaleItemSimple } from '../personal-sale-item-simple'
import { PersonalSaleItemDetailed } from '../personal-sale-item-detailed'
import { cn } from '@/lib/utils'
import type { CommissionRule } from '@/types'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

// TODO: props like selectedSupplier, calculateTieredRate, onUpdateValueEntry, onProductSearchClick, removingIds
// are kept in the type for compatibility but no longer used in this component after desktop view removal

export type ValueEntry = {
  id: string
  quantity: number
  grossValue: string
  taxRate: string
  commissionRate: string
  productId?: string | null
  productName?: string
}

type ValuesSectionProps = {
  informItems: boolean
  supplierId: string
  valueEntries: ValueEntry[]
  removingIds: Set<string>
  swipedItemId: string | null
  selectedSupplier: PersonalSupplierWithRules | undefined
  onInformItemsChange: (checked: boolean) => void
  onAddValueEntry: () => void
  onAddValueEntryAndEdit?: () => void
  onRemoveValueEntry: (id: string) => void
  onUpdateValueEntry: (id: string, field: keyof Omit<ValueEntry, 'id'>, value: string | number) => void
  onProductSearchClick: (entryId: string) => void
  onSwipedItemIdChange: (id: string | null) => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (entryId: string) => void
  onEditingEntryClick: (entryId: string) => void
  calculateTieredRate: (rule: CommissionRule, value: number) => number
}

export function ValuesSection({
  informItems,
  supplierId,
  valueEntries,
  removingIds,
  swipedItemId,
  selectedSupplier,
  onInformItemsChange,
  onAddValueEntry,
  onAddValueEntryAndEdit,
  onRemoveValueEntry,
  onUpdateValueEntry,
  onProductSearchClick,
  onSwipedItemIdChange,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onEditingEntryClick,
  calculateTieredRate,
}: ValuesSectionProps) {
  const totalValue = useMemo(() => {
    return valueEntries.reduce((sum, entry) => {
      const quantity = informItems ? entry.quantity || 1 : 1
      const gross = parseFloat(entry.grossValue) || 0
      const taxRate = parseFloat(entry.taxRate) || 0
      return sum + quantity * gross * (1 - taxRate / 100)
    }, 0)
  }, [valueEntries, informItems])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Valores</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {informItems
              ? 'Cada item pode ter taxas e comissões diferentes.'
              : 'Cada valor pode ter taxas e comissões diferentes.'}
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
          <Label
            htmlFor="inform-items-switch"
            className="text-[12px] font-bold text-muted-foreground/80 cursor-pointer"
          >
            Detalhado
          </Label>
          <Switch
            id="inform-items-switch"
            checked={informItems}
            onCheckedChange={(checked) => {
              if (checked && !supplierId) {
                toast.error('Selecione um fornecedor primeiro para ativar o modo detalhado')
                return
              }
              onInformItemsChange(checked)
            }}
            className="scale-75 data-[state=checked]:bg-primary"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {/* Corpo: Inputs Centralizados */}
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex flex-col w-full gap-2">
              {valueEntries
                .filter((e) => e.productName || parseFloat(e.grossValue) > 0)
                .map((entry) => {
                  const isSwiped = swipedItemId === entry.id
                  const ItemComponent = informItems
                    ? PersonalSaleItemDetailed
                    : PersonalSaleItemSimple

                  return (
                    <ItemComponent
                      key={entry.id}
                      entry={entry}
                      isSwiped={isSwiped}
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={() => onTouchEnd(entry.id)}
                      onClick={() => {
                        if (isSwiped) {
                          onSwipedItemIdChange(null)
                        } else {
                          onEditingEntryClick(entry.id)
                        }
                      }}
                      onDelete={() => onRemoveValueEntry(entry.id)}
                    />
                  )
                })}

              <Button
                type="button"
                variant="outline"
                className={cn(
                  'h-12 border-dashed border-2 border-primary/30 text-primary hover:bg-primary/5 rounded-xl font-semibold flex gap-2 transition-all mt-4',
                  !valueEntries.some((e) => e.productName || parseFloat(e.grossValue) > 0) &&
                    'h-16 text-base border-primary/50 bg-primary/[0.02]'
                )}
                onClick={() => {
                  if (onAddValueEntryAndEdit) {
                    onAddValueEntryAndEdit()
                  } else {
                    onAddValueEntry()
                  }
                }}
              >
                <Plus className="h-5 w-5" />
                {valueEntries.some((e) => e.productName || parseFloat(e.grossValue) > 0)
                  ? informItems ? 'Adicionar outro item' : 'Adicionar outro valor'
                  : informItems ? 'Adicionar item' : 'Adicionar valor'}
              </Button>
            </div>

          </div>
        </div>
      </CardContent>

      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        valueEntries.some(e => e.productName || parseFloat(e.grossValue) > 0)
          ? "grid-rows-[1fr] opacity-100"
          : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <CardFooter className="flex flex-col gap-1 pt-0">
            {/* Linha Separadora com Ícone de Conexão */}
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center">
                <div className="bg-card px-3">
                  <svg
                    className="h-5 w-5 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Grid de Totais Refinado */}
            <div className="flex flex-col w-full pt-1">
              {/* Top: Dados Auxiliares Agrupados */}
              <div className="grid grid-cols-2 relative py-4 border-b border-dashed border-border/60">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                    Total Geral
                  </span>
                  <span className="text-base font-bold text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      valueEntries.reduce(
                        (sum, entry) =>
                          sum +
                          (informItems ? entry.quantity || 1 : 1) * (parseFloat(entry.grossValue) || 0),
                        0
                      )
                    )}
                  </span>
                </div>

                {/* Divisor Vertical Interno */}
                <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-px h-6 bg-border/60" />

                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                    Base de Cálculo
                  </span>
                  <span className="text-base font-bold text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      totalValue
                    )}
                  </span>
                </div>
              </div>

              {/* Bottom: Comissão (Destaque com Fundo Sutil) */}
              <div className="flex flex-col items-center gap-1 py-6 bg-muted/60 rounded-b-2xl">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.15em] mb-0.5">
                  Sua Comissão
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    valueEntries.reduce((sum, entry) => {
                      const qty = informItems ? entry.quantity || 1 : 1
                      const gross = parseFloat(entry.grossValue) || 0
                      const taxRate = parseFloat(entry.taxRate) || 0
                      const commRate = parseFloat(entry.commissionRate) || 0
                      const base = qty * gross * (1 - taxRate / 100)
                      return sum + base * (commRate / 100)
                    }, 0)
                  )}
                </span>
              </div>
            </div>
          </CardFooter>
        </div>
      </div>
    </Card>
  )
}
