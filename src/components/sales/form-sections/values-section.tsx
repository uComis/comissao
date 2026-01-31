import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { DashedActionButton } from '@/components/ui/dashed-action-button'
import type { CommissionRule } from '@/types'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import { PersonalSaleItemDetailed } from '../personal-sale-item-detailed'
import { PersonalSaleItemSimple } from '../personal-sale-item-simple'

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
  valueEntries,
  swipedItemId,
  onAddValueEntry,
  onAddValueEntryAndEdit,
  onRemoveValueEntry,
  onSwipedItemIdChange,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onEditingEntryClick,
}: ValuesSectionProps) {
  const totalValue = useMemo(() => {
    return valueEntries.reduce((sum, entry) => {
      const quantity = informItems ? entry.quantity || 1 : 1
      const gross = parseFloat(entry.grossValue) || 0
      const taxRate = parseFloat(entry.taxRate) || 0
      return sum + quantity * gross * (1 - taxRate / 100)
    }, 0)
  }, [valueEntries, informItems])

  const totalGross = useMemo(() => {
    return valueEntries.reduce((sum, entry) => {
      const quantity = informItems ? entry.quantity || 1 : 1
      const gross = parseFloat(entry.grossValue) || 0
      return sum + quantity * gross
    }, 0)
  }, [valueEntries, informItems])

  const totalCommission = useMemo(() => {
    return valueEntries.reduce((sum, entry) => {
      const qty = informItems ? entry.quantity || 1 : 1
      const gross = parseFloat(entry.grossValue) || 0
      const taxRate = parseFloat(entry.taxRate) || 0
      const commRate = parseFloat(entry.commissionRate) || 0
      const base = qty * gross * (1 - taxRate / 100)
      return sum + base * (commRate / 100)
    }, 0)
  }, [valueEntries, informItems])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
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

            <DashedActionButton
              icon={<Plus className="h-4 w-4" />}
              className="mt-4"
              onClick={() => {
                if (onAddValueEntryAndEdit) {
                  onAddValueEntryAndEdit()
                } else {
                  onAddValueEntry()
                }
              }}
            >
              {valueEntries.some((e) => e.productName || parseFloat(e.grossValue) > 0)
                ? informItems ? 'Adicionar outro item' : 'Adicionar outro valor'
                : informItems ? 'Adicionar item' : 'Adicionar valor'}
            </DashedActionButton>
          </div>
        </div>
      </div>

      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        valueEntries.some(e => e.productName || parseFloat(e.grossValue) > 0)
          ? "grid-rows-[1fr] opacity-100"
          : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="flex flex-col gap-1 pt-4">
            {/* Linha Separadora com Ícone de Conexão */}
            <div className="relative w-full py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center">
                <div className="bg-background px-3">
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
              <div className="grid grid-cols-2 relative py-4 border-b border-dashed border-border/60">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                    Total Geral
                  </span>
                  <span className="text-base font-bold text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGross)}
                  </span>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-px h-6 bg-border/60" />

                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                    Base de Cálculo
                  </span>
                  <span className="text-base font-bold text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 py-6 bg-muted/60 rounded-2xl">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.15em] mb-0.5">
                  Sua Comissão
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCommission)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
