import { useRef, useEffect, useState, useMemo, type RefObject } from 'react'
import { Search, Plus, Wand2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { CompactNumberInput } from '@/components/ui/compact-number-input'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PersonalSaleItemSimple } from '../personal-sale-item-simple'
import { PersonalSaleItemDetailed } from '../personal-sale-item-detailed'
import { cn } from '@/lib/utils'
import type { Product, CommissionRule } from '@/types'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

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
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const isIntermediate = informItems && containerWidth > 0 && containerWidth < 670

  const totalValue = useMemo(() => {
    return valueEntries.reduce((sum, entry) => {
      const quantity = informItems ? entry.quantity || 1 : 1
      const gross = parseFloat(entry.grossValue) || 0
      const taxRate = parseFloat(entry.taxRate) || 0
      return sum + quantity * gross * (1 - taxRate / 100)
    }, 0)
  }, [valueEntries, informItems])

  const applyRule = (ruleId: string) => {
    const rule = selectedSupplier?.commission_rules.find((r) => r.id === ruleId)
    if (rule) {
      if (rule.type === 'fixed' && rule.percentage) {
        onUpdateValueEntry(valueEntries[0].id, 'commissionRate', rule.percentage.toString())
        toast.success(`Taxa de ${rule.percentage}% aplicada!`)
      }
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Valores</CardTitle>
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
            {/* Cabeçalho de Tabela - Negrito e Próximo */}
            <div
              className={cn(
                'gap-4 w-full pr-8 mb-0.5',
                isIntermediate ? 'hidden' : 'hidden md:grid',
                informItems &&
                  !isIntermediate &&
                  'max-w-none grid-cols-[1.5fr_100px_1.2fr_0.8fr_1.2fr]',
                !informItems && !isIntermediate && 'max-w-2xl mx-auto md:grid-cols-[1.5fr_0.8fr_1.2fr]'
              )}
            >
              {informItems && (
                <>
                  <Label className="text-[11px] text-muted-foreground font-bold text-left pl-1">
                    Item
                  </Label>
                  <Label className="text-[11px] text-muted-foreground font-bold text-center">
                    Qntd.
                  </Label>
                </>
              )}
              <Label className="text-[11px] text-muted-foreground font-bold text-left pl-1">
                {informItems ? 'Preço' : 'Valor'}
              </Label>
              <Label className="text-[11px] text-muted-foreground font-bold text-center">
                Impostos
              </Label>
              <Label className="text-[11px] text-muted-foreground font-bold text-center">
                Comissão
              </Label>
            </div>

            <div
              ref={containerRef}
              className={cn(
                'hidden md:flex flex-col gap-3 w-full',
                informItems ? 'max-w-none' : 'max-w-2xl'
              )}
            >
              {valueEntries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out [grid-template-rows:1fr] data-[new=true]:animate-[grow_0.3s_ease-in-out] data-[removing=true]:[grid-template-rows:0fr]"
                  data-entry-id={entry.id}
                  data-new={index > 0 && entry.grossValue === ''}
                  data-removing={removingIds.has(entry.id)}
                >
                  <div className="overflow-hidden">
                    <div
                      className={cn(
                        'flex justify-center py-1 pb-6 pt-2 relative group border-b border-border animate-in fade-in slide-in-from-top-2 duration-500 delay-150 fill-mode-both data-[removing=true]:animate-out data-[removing=true]:fade-out data-[removing=true]:slide-out-to-top-1 data-[removing=true]:duration-200',
                        index === valueEntries.length - 1 && 'border-b-0 pb-2'
                      )}
                      data-removing={removingIds.has(entry.id)}
                    >
                      <div
                        className={cn(
                          'flex flex-wrap items-end gap-x-4 gap-y-4 relative w-full pr-8',
                          'md:grid md:flex-none',
                          informItems
                            ? isIntermediate
                              ? 'md:grid-cols-6'
                              : 'md:grid-cols-[1.5fr_100px_1.2fr_0.8fr_1.2fr]'
                            : 'md:max-w-2xl md:mx-auto md:grid-cols-[1.5fr_0.8fr_1.2fr]'
                        )}
                      >
                        {/* Group 1: Item + Qntd (Apenas se informItems) */}
                        {informItems && (
                          <>
                            {/* Item Selector */}
                            <div
                              className={cn(
                                'flex flex-col gap-2 min-w-0',
                                isIntermediate ? 'col-span-4' : ''
                              )}
                            >
                              <Label
                                className={cn(
                                  'text-[10px] text-muted-foreground font-bold',
                                  isIntermediate ? 'block pl-1' : 'text-center md:hidden'
                                )}
                              >
                                Item
                              </Label>
                              <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                  'h-11 w-full border-2 transition-all rounded-xl justify-between px-3 shadow-md bg-white',
                                  entry.productId
                                    ? 'border-border text-foreground'
                                    : 'hover:border-primary/50 font-normal text-muted-foreground'
                                )}
                                onClick={() => {
                                  if (!supplierId) {
                                    toast.error('Selecione um fornecedor primeiro')
                                    return
                                  }
                                  onProductSearchClick(entry.id)
                                }}
                              >
                                <span className="truncate text-sm font-medium">
                                  {entry.productName || 'Selecionar item...'}
                                </span>
                                <Search className="h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </div>

                            {/* Quantidade */}
                            <div
                              className={cn(
                                'flex flex-col gap-2 shrink-0',
                                isIntermediate ? 'col-span-2' : ''
                              )}
                            >
                              <Label
                                className={cn(
                                  'text-[10px] text-muted-foreground font-bold',
                                  isIntermediate ? 'block text-center' : 'text-center md:hidden'
                                )}
                              >
                                Qntd.
                              </Label>
                              <CompactNumberInput
                                value={entry.quantity}
                                onChange={(val) => onUpdateValueEntry(entry.id, 'quantity', val)}
                                min={1}
                                step={1}
                                decimals={0}
                                className="w-full"
                              />
                            </div>
                          </>
                        )}

                        {/* Preço / Valor */}
                        <div
                          className={cn(
                            'flex flex-col gap-2 min-w-0',
                            isIntermediate ? 'col-span-2' : ''
                          )}
                        >
                          <div
                            className={cn(
                              'flex items-center gap-1.5 whitespace-nowrap overflow-hidden',
                              isIntermediate ? 'justify-start pl-1' : 'justify-center'
                            )}
                          >
                            <Label
                              htmlFor={`gross_value_${entry.id}`}
                              className={cn(
                                'text-[10px] text-muted-foreground font-bold shrink-0',
                                isIntermediate ? 'block' : 'md:hidden'
                              )}
                            >
                              {informItems ? 'Preço' : 'Valor'}
                            </Label>
                            {informItems && entry.quantity > 1 && (
                              <span className="text-[10px] text-muted-foreground/50 font-medium animate-in fade-in slide-in-from-left-1 duration-300 truncate">
                                (
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(entry.quantity * (parseFloat(entry.grossValue) || 0))}
                                )
                              </span>
                            )}
                          </div>
                          <CurrencyInput
                            id={`gross_value_${entry.id}`}
                            placeholder="0,00"
                            value={entry.grossValue}
                            onChange={(val) => onUpdateValueEntry(entry.id, 'grossValue', val)}
                          />
                        </div>

                        {/* Impostos */}
                        <div
                          className={cn(
                            'flex flex-col gap-2 min-w-0',
                            isIntermediate ? 'col-span-2' : ''
                          )}
                        >
                          <Label
                            className={cn(
                              'text-[10px] text-muted-foreground font-bold',
                              isIntermediate ? 'block text-center' : 'text-center md:hidden'
                            )}
                          >
                            Impostos
                          </Label>
                          <CompactNumberInput
                            value={entry.taxRate ? parseFloat(entry.taxRate) : 0}
                            onChange={(val) =>
                              onUpdateValueEntry(entry.id, 'taxRate', String(val))
                            }
                            min={0}
                            max={100}
                            step={0.5}
                            decimals={2}
                            suffix="%"
                            accentColor="#f59e0b"
                            className="w-full"
                          />
                        </div>

                        {/* Comissão */}
                        <div
                          className={cn(
                            'flex flex-col gap-2 min-w-0',
                            isIntermediate ? 'col-span-2' : ''
                          )}
                        >
                          <Label
                            className={cn(
                              'text-[10px] text-muted-foreground font-bold',
                              isIntermediate ? 'block text-center' : 'text-center md:hidden'
                            )}
                          >
                            Comissão
                          </Label>
                          <div className="flex items-center gap-2">
                            <CompactNumberInput
                              value={entry.commissionRate ? parseFloat(entry.commissionRate) : 0}
                              onChange={(val) =>
                                onUpdateValueEntry(entry.id, 'commissionRate', String(val))
                              }
                              min={0}
                              max={100}
                              step={0.5}
                              decimals={2}
                              suffix="%"
                              accentColor="#67C23A"
                              className="w-full"
                            />

                            {index === 0 &&
                              selectedSupplier &&
                              selectedSupplier.commission_rules.length > 0 && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-11 w-11 shrink-0 border-dashed border-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all rounded-xl"
                                    >
                                      <Wand2 className="h-5 w-5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Regras de Faixa</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {selectedSupplier.commission_rules
                                      .filter((r) => r.type === 'tiered')
                                      .map((rule) => (
                                        <DropdownMenuItem
                                          key={rule.id}
                                          onClick={() => applyRule(rule.id)}
                                          className="flex justify-between items-center cursor-pointer"
                                        >
                                          <span>{rule.name}</span>
                                          <span className="font-bold text-muted-foreground">
                                            {calculateTieredRate(
                                              rule,
                                              parseFloat(entry.grossValue) || 0
                                            )}
                                            %
                                          </span>
                                        </DropdownMenuItem>
                                      ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                          </div>
                        </div>

                        {/* Botão Remover - Discreto e Colado nos inputs */}
                        {valueEntries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onRemoveValueEntry(entry.id)}
                            className="absolute right-0 top-3 p-1 text-destructive/40 hover:text-destructive transition-all opacity-100 cursor-pointer"
                            title="Remover valor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* V3: Mobile View (List Items like Bank Extract) - Apenas se Tela < 768px (sm) */}
            <div className="md:hidden flex flex-col w-full gap-2">
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
                  const newId = Math.random().toString(36).substr(2, 9)
                  const newEntry: ValueEntry = {
                    id: newId,
                    quantity: 1,
                    grossValue: '',
                    taxRate: selectedSupplier
                      ? String(selectedSupplier.default_tax_rate || 0)
                      : '0',
                    commissionRate: selectedSupplier
                      ? String(selectedSupplier.default_commission_rate || 0)
                      : '0',
                    productName: '',
                  }
                  // Trigger add via parent
                  onEditingEntryClick(newId)
                }}
              >
                <Plus className="h-5 w-5" />
                {valueEntries.some((e) => e.productName || parseFloat(e.grossValue) > 0)
                  ? 'Adicionar outro'
                  : 'Adicionar item'}
              </Button>
            </div>

            {/* Botão Adicionar Valor - ORIGINAL Desktop - Escondido no Mobile */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden md:flex border-dashed border-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-300"
              onClick={onAddValueEntry}
            >
              + Adicionar valor
            </Button>
          </div>
        </div>
      </CardContent>

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
    </Card>
  )
}
