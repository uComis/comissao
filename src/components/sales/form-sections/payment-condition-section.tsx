import { useState, useRef, useEffect, useCallback } from 'react'
import { Banknote, Calendar, CalendarCheck, ChevronRight, Hash, PencilIcon, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { NumberStepper } from '@/components/ui/number-stepper'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { DashedActionButton } from '@/components/ui/dashed-action-button'

type PaymentConditionSectionProps = {
  saleDate: string
  firstInstallmentDate: string
  installments: string | number
  interval: string | number
  firstInstallmentDays: string | number
  quickCondition: string
  irregularPatternWarning: string | null
  customDaysList: number[] | null
  detectedPattern: { interval: number; count: number } | null
  totalValue: number
  grossTotal: number
  totalCommission: number
  onSaleDateChange: (date: string) => void
  onFirstInstallmentDateChange: (date: string) => void
  onInstallmentsChange: (value: number) => void
  onIntervalChange: (value: number) => void
  onFirstInstallmentDaysChange: (value: number) => void
  onQuickConditionChange: (value: string) => void
  onQuickConditionBlur: () => void
  onClearCondition: () => void
  onPatternAdd: () => void
  onPatternRemove: () => void
  onSelectSuggestion: (value: string) => void
  onViewInstallments?: () => void
}

const suggestions = [
  { label: 'À vista', value: '0', description: 'Pagamento total na data da venda' },
  { label: '30 dias', value: '30', description: 'Uma parcela após 30 dias' },
  { label: '30/60 dias', value: '30/60', description: 'Duas parcelas (30 e 60 dias)' },
  { label: '30/60/90 dias', value: '30/60/90', description: 'Três parcelas mensais' },
]

function getSafeNumber(val: string | number, fallback: number): number {
  const num = typeof val === 'string' ? parseInt(val) : val
  return isNaN(num) ? fallback : num
}

function calculateDateFromDays(days: number, saleDate: string): string {
  const date = saleDate ? new Date(saleDate + 'T12:00:00') : new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  const day = date.getDate()
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  const year = date.getFullYear()
  return `${day} de ${month.charAt(0).toUpperCase() + month.slice(1)}. ${year}`
}

function summarizeSchedule(raw: string): string {
  const parts = raw.split('/').map(p => parseInt(p.trim())).filter(n => !isNaN(n))
  if (parts.length <= 3) return raw
  const interval = parts[1] - parts[0]
  const isRegular = interval > 0 && parts.every((v, i) => i === 0 || v - parts[i - 1] === interval)
  if (!isRegular) return raw
  return `${parts[0]}/${parts[1]}/${parts[2]}…${parts[parts.length - 1]} (${parts.length}x)`
}

function FormulaSeparator() {
  return (
    <div className="relative flex items-center my-4">
      <div className="flex-1 border-t border-border/50" />
      <span className="mx-3 text-xs font-mono text-muted-foreground bg-background px-2">ƒx</span>
      <div className="flex-1 border-t border-border/50" />
    </div>
  )
}

function PaymentFormContent({
  saleDate,
  firstInstallmentDate,
  installments,
  interval,
  firstInstallmentDays,
  quickCondition,
  irregularPatternWarning,
  onSaleDateChange,
  onFirstInstallmentDateChange,
  onInstallmentsChange,
  onIntervalChange,
  onFirstInstallmentDaysChange,
  onQuickConditionChange,
  onQuickConditionBlur,
  onClearCondition,
  onSelectSuggestion,
}: PaymentConditionSectionProps & { onClose: () => void }) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [fadeState, setFadeState] = useState<'visible' | 'fading-out' | 'fading-in'>('visible')
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto')

  const safeInst = getSafeNumber(installments, 1)
  const safeInterval = getSafeNumber(interval, 30)
  const safeFirstDays = getSafeNumber(firstInstallmentDays, 0)
  const isVista = safeInst === 1

  // Measure content height after render
  useEffect(() => {
    if (contentRef.current && fadeState === 'visible') {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [isVista, fadeState, irregularPatternWarning, quickCondition])

  const switchTab = useCallback((toVista: boolean) => {
    if (toVista === isVista) return
    // Start fade out
    setFadeState('fading-out')
    setTimeout(() => {
      // Apply the actual change
      if (toVista) {
        onInstallmentsChange(1)
        onIntervalChange(0)
      } else {
        onInstallmentsChange(2)
        onIntervalChange(30)
        if (safeFirstDays <= 0) onFirstInstallmentDaysChange(30)
      }
      // Start fade in
      setFadeState('fading-in')
      // Measure new height after state update
      requestAnimationFrame(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.scrollHeight)
        }
      })
      setTimeout(() => {
        setFadeState('visible')
      }, 200)
    }, 150)
  }, [isVista, safeFirstDays, onInstallmentsChange, onIntervalChange, onFirstInstallmentDaysChange])

  return (
    <div className="space-y-5">
      {/* Segmented control */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-muted/50 rounded-lg">
        <button
          type="button"
          onClick={() => switchTab(true)}
          className={cn(
            'py-2.5 text-sm font-medium rounded-md transition-all',
            isVista
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          À Vista
        </button>
        <button
          type="button"
          onClick={() => switchTab(false)}
          className={cn(
            'py-2.5 text-sm font-medium rounded-md transition-all',
            !isVista
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Parcelado
        </button>
      </div>

      {/* Animated content area */}
      <div
        className="overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{ height: contentHeight === 'auto' ? 'auto' : contentHeight }}
      >
        <div
          ref={contentRef}
          className={cn(
            'transition-opacity duration-150 ease-in-out space-y-5',
            fadeState === 'fading-out' && 'opacity-0',
            fadeState === 'fading-in' && 'opacity-0 animate-[fadeIn_200ms_ease-in-out_forwards]',
            fadeState === 'visible' && 'opacity-100',
          )}
        >
          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground ml-1">Data da Compra</Label>
              <DatePicker
                date={saleDate ? new Date(saleDate + 'T12:00:00') : new Date()}
                onDateChange={(date) => onSaleDateChange(date ? date.toISOString().split('T')[0] : '')}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground ml-1">{isVista ? 'Vencimento' : '1ª Parcela'}</Label>
              <DatePicker
                date={new Date((firstInstallmentDate || calculateDateFromDays(safeFirstDays, saleDate)) + 'T12:00:00')}
                onDateChange={(date) => {
                  if (date) onFirstInstallmentDateChange(date.toISOString().split('T')[0])
                }}
              />
            </div>
          </div>

          {/* À vista: prazo em dias */}
          {isVista && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground ml-1">Prazo (dias após venda)</Label>
              <NumberStepper value={safeFirstDays} onChange={onFirstInstallmentDaysChange} min={0} max={180} zeroLabel="Mesmo dia" />
            </div>
          )}

          {/* Cronograma input - only for parcelado */}
          {!isVista && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground ml-1">Cronograma</Label>
              <div className="relative">
                <Input
                  placeholder="Ex: 30/60/90"
                  value={isInputFocused ? quickCondition : summarizeSchedule(quickCondition)}
                  onChange={(e) => onQuickConditionChange(e.target.value)}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowSuggestions(false)
                      onQuickConditionBlur()
                    }, 200)
                  }}
                  onFocus={() => {
                    setShowSuggestions(true)
                    setIsInputFocused(true)
                  }}
                  className="h-12 text-base font-medium rounded-xl border-2 focus-visible:ring-0 focus-visible:border-primary/50 transition-all pr-10"
                />
                {quickCondition && (
                  <button
                    type="button"
                    onClick={onClearCondition}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {showSuggestions && isInputFocused && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-64 overflow-auto">
                    {suggestions
                      .filter(s => s.value !== '0')
                      .filter(s => s.value.startsWith(quickCondition) || s.label.toLowerCase().includes(quickCondition.toLowerCase()))
                      .map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            onSelectSuggestion(s.value)
                            setShowSuggestions(false)
                            setIsInputFocused(false)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-muted flex items-center justify-between gap-2 transition-colors"
                        >
                          <span className="font-medium text-sm">{s.label}</span>
                          {s.description && <span className="text-[10px] text-muted-foreground">{s.description}</span>}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {irregularPatternWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3">
                  <div className="h-5 w-5 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-amber-600 font-bold text-xs">!</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">{irregularPatternWarning}</p>
                </div>
              )}

              <FormulaSeparator />

              {/* Card resultado */}
              <div className="bg-muted/30 rounded-xl border border-border/50 p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground ml-1">Nº Parcelas</Label>
                    <NumberStepper value={safeInst} onChange={onInstallmentsChange} min={1} max={36} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground ml-1">Intervalo (dias)</Label>
                    <NumberStepper value={safeInterval} onChange={onIntervalChange} min={0} max={180} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground ml-1">1ª parcela (dias após venda)</Label>
                  <NumberStepper value={safeFirstDays} onChange={onFirstInstallmentDaysChange} min={0} max={180} zeroLabel="Mesmo dia" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function PaymentConditionSection(props: PaymentConditionSectionProps) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  const safeInst = getSafeNumber(props.installments, 1)
  const safeInterval = getSafeNumber(props.interval, 30)
  const safeFirstDays = getSafeNumber(props.firstInstallmentDays, 0)
  const isVista = safeInst === 1

  const firstDate = props.firstInstallmentDate || calculateDateFromDays(safeFirstDays, props.saleDate)

  const scheduleRaw = props.quickCondition || `${safeFirstDays}/${Array.from({ length: safeInst - 1 }, (_, i) => safeFirstDays + (i + 1) * safeInterval).join('/')}`
  const schedule = summarizeSchedule(scheduleRaw)

  const summaryLabel = isVista ? 'À vista' : `Parcelado ${safeInst}x`

  const hasConfig = !!(props.quickCondition || safeInst > 1 || safeFirstDays > 0)

  const formContent = (
    <div className="space-y-5">
      <PaymentFormContent {...props} onClose={() => setOpen(false)} />
      <Button
        type="button"
        onClick={() => setOpen(false)}
        className="w-full h-12 text-base font-medium"
      >
        Confirmar
      </Button>
    </div>
  )

  return (
    <>
      {/* Resumo */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Pagamento</h3>
        {hasConfig && (
          <div className="grid gap-4 grid-cols-2">
            <div className="flex items-center gap-4">
              <Banknote className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{summaryLabel}</span>
                <span className="text-muted-foreground text-sm">Condição</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{formatDateShort(props.saleDate)}</span>
                <span className="text-muted-foreground text-sm">Data da venda</span>
              </div>
            </div>
            {(!isVista || safeFirstDays > 0) && (
              <div className="flex items-center gap-4">
                <CalendarCheck className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{formatDateShort(firstDate)}</span>
                  <span className="text-muted-foreground text-sm">1ª parcela</span>
                </div>
              </div>
            )}
            {!isVista && (
              <div className="flex items-center gap-4">
                <Hash className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold font-mono">{schedule}</span>
                  <span className="text-muted-foreground text-sm">Cronograma</span>
                </div>
              </div>
            )}
          </div>
        )}
        {hasConfig && !isVista ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12"
              onClick={() => setOpen(true)}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12"
              onClick={() => props.onViewInstallments?.()}
            >
              Ver parcelas
            </Button>
          </div>
        ) : (
          <DashedActionButton
            icon={<PencilIcon className="h-4 w-4" />}
            onClick={() => setOpen(true)}
          >
            {hasConfig ? 'Editar pagamento' : 'Configurar pagamento'}
          </DashedActionButton>
        )}
      </div>

      {/* Modal (desktop) / Drawer (mobile) */}
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Condições de Pagamento</DrawerTitle>
              <DrawerDescription className="sr-only">Configure as condições de pagamento da venda</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto">
              {formContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Condições de Pagamento</DialogTitle>
              <DialogDescription className="sr-only">Configure as condições de pagamento da venda</DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
