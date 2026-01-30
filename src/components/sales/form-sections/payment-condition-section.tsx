import { useEffect, useMemo, useState } from 'react'
import { Calendar, CalendarDays, ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NumberStepper } from '@/components/ui/number-stepper'
import { cn } from '@/lib/utils'

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
  onPatternAdd: () => void
  onPatternRemove: () => void
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
  onSelectSuggestion: (value: string) => void
}

const paymentConditionSuggestions = [
  { label: 'À vista', value: '0' },
  { label: '30/60/90', value: '30/60/90', description: 'Entrada 30, intervalo 30' },
  { label: '28/56/84', value: '28/56/84', description: 'Ciclo 28 dias' },
  { label: '30/45/60/75/90', value: '30/45/60/75/90', description: 'Entrada 30, intervalo 15' },
  { label: '15/45/75/105', value: '15/45/75/105', description: 'Entrada 15, intervalo 30' },
  { label: '15/30/45/60', value: '15/30/45/60', description: 'Entrada 15, intervalo 15' },
  { label: '20/50/80/110', value: '20/50/80/110', description: 'Entrada 20, intervalo 30' },
  { label: '45/75/105', value: '45/75/105', description: 'Entrada 45, intervalo 30' },
  { label: '60/90/120', value: '60/90/120', description: 'Entrada 60, intervalo 30' },
]

const getSafeNumber = (val: string | number, min: number = 0) => {
  if (val === '' || val === undefined || val === null) return min
  const num = typeof val === 'string' ? parseInt(val) : val
  return isNaN(num) ? min : num
}

const calculateDateFromDays = (days: number, baseDateStr: string) => {
  const date = new Date(baseDateStr + 'T12:00:00')
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export function PaymentConditionSection({
  saleDate,
  firstInstallmentDate,
  installments,
  interval,
  firstInstallmentDays,
  quickCondition,
  irregularPatternWarning,
  customDaysList,
  detectedPattern,
  onPatternAdd,
  onPatternRemove,
  totalValue,
  grossTotal,
  totalCommission,
  onSaleDateChange,
  onFirstInstallmentDateChange,
  onInstallmentsChange,
  onIntervalChange,
  onFirstInstallmentDaysChange,
  onQuickConditionChange,
  onQuickConditionBlur,
  onSelectSuggestion,
}: PaymentConditionSectionProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [expandedPreview, setExpandedPreview] = useState(false)

  // Reset expand when installment count changes (e.g. +/- buttons)
  useEffect(() => {
    setExpandedPreview(false)
  }, [installments])

  const [parceladoMode, setParceladoMode] = useState<'simples' | 'rapido'>('simples')
  const [customInstallments, setCustomInstallments] = useState(false)
  const [customInterval, setCustomInterval] = useState(false)
  const [customFirstDays, setCustomFirstDays] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePickerSelected, setDatePickerSelected] = useState(false)
  const [firstDaysChosen, setFirstDaysChosen] = useState(false)
  const [installmentsChosen, setInstallmentsChosen] = useState(false)

  const safeInstallments = getSafeNumber(installments, 1)
  const isMultipleInstallments = safeInstallments > 1

  // Show all steps if editing existing sale (values already set)
  const showInstallmentsStep = firstDaysChosen
  const showIntervalStep = installmentsChosen && isMultipleInstallments

  const filteredSuggestions = paymentConditionSuggestions.filter(
    (suggestion) =>
      suggestion.value.startsWith(quickCondition) ||
      suggestion.label.toLowerCase().includes(quickCondition.toLowerCase()) ||
      quickCondition === ''
  )

  const installmentDates = useMemo(() => {
    const safeInst = getSafeNumber(installments, 1)
    const safeInterval = getSafeNumber(interval, 30)

    let firstDate: Date
    let lastDate: Date

    if (customDaysList && customDaysList.length === safeInst) {
      const saleDateObj = saleDate ? new Date(saleDate + 'T12:00:00') : new Date()
      firstDate = new Date(saleDateObj)
      firstDate.setDate(firstDate.getDate() + customDaysList[0])
      lastDate = new Date(saleDateObj)
      lastDate.setDate(lastDate.getDate() + customDaysList[customDaysList.length - 1])
    } else {
      if (firstInstallmentDate) {
        firstDate = new Date(firstInstallmentDate + 'T12:00:00')
      } else {
        const safeFirstDays = getSafeNumber(firstInstallmentDays, 30)
        firstDate = new Date(calculateDateFromDays(safeFirstDays, saleDate) + 'T12:00:00')
      }
      lastDate = new Date(firstDate)
      lastDate.setDate(lastDate.getDate() + (safeInst - 1) * safeInterval)
    }

    return {
      first: new Intl.DateTimeFormat('pt-BR').format(firstDate),
      last: new Intl.DateTimeFormat('pt-BR').format(lastDate),
    }
  }, [installments, interval, firstInstallmentDate, firstInstallmentDays, saleDate, customDaysList])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pagamento</CardTitle>
        <div className="flex gap-1 bg-muted p-0.5 rounded-full">
          <button
            type="button"
            onClick={() => {
              setParceladoMode('simples')

              // Sync UI state from current data
              const currentFirstDays = getSafeNumber(firstInstallmentDays, 0)
              const currentInstallments = getSafeNumber(installments, 1)
              const currentInterval = getSafeNumber(interval, 30)

              const hasData = currentInstallments > 1 || currentFirstDays > 0

              setFirstDaysChosen(hasData)
              setInstallmentsChosen(hasData)
              setDatePickerSelected(false)
              setShowDatePicker(false)

              // Determine if preset buttons match or need "Outro"
              const firstDaysPresets = [0, 15, 30, 45]
              setCustomFirstDays(hasData && !firstDaysPresets.includes(currentFirstDays))

              const installmentsPresets = [1, 2, 3, 4, 5, 6]
              setCustomInstallments(hasData && !installmentsPresets.includes(currentInstallments))

              const intervalPresets = [15, 30, 45]
              setCustomInterval(hasData && currentInstallments > 1 && !intervalPresets.includes(currentInterval))
            }}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-all',
              parceladoMode === 'simples'
                ? 'bg-background shadow-sm text-foreground ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Simples
          </button>
          <button
            type="button"
            onClick={() => setParceladoMode('rapido')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-all',
              parceladoMode === 'rapido'
                ? 'bg-background shadow-sm text-foreground ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Rápido
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-2 py-4">
          <Label htmlFor="date" className="text-sm font-medium flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Data da Venda
          </Label>
          <div className="w-full max-w-[220px]">
            <DatePicker
              date={saleDate ? new Date(saleDate + 'T12:00:00') : undefined}
              onDateChange={(date) => {
                if (date) {
                  const dateStr = date.toISOString().split('T')[0]
                  onSaleDateChange(dateStr)
                }
              }}
              placeholder="Selecione a data da venda"
            />
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <div key={parceladoMode} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {parceladoMode === 'rapido' ? (
            <>
              {/* Modo Rápido: Input com Autocomplete */}
              <div className="space-y-3">
                <Label
                  htmlFor="quick_condition"
                  className="text-sm font-medium text-center block text-primary"
                >
                  Digite os prazos
                </Label>
                <div className="relative max-w-md mx-auto">
                  <Input
                    id="quick_condition"
                    placeholder="ex: 0 (à vista) ou 30/60/90"
                    value={quickCondition}
                    onChange={(e) => onQuickConditionChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        ;(e.target as HTMLInputElement).blur()
                      }
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowSuggestions(false)
                        onQuickConditionBlur()
                      }, 150)
                    }}
                    className={`h-14 text-xl font-medium text-center border-2 focus-visible:ring-0 shadow-sm ${
                      irregularPatternWarning
                        ? 'border-red-400 focus-visible:border-red-500'
                        : 'border-primary/20 focus-visible:border-primary'
                    }`}
                  />

                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-64 overflow-auto">
                      {filteredSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-muted flex items-center justify-between gap-2 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            onSelectSuggestion(suggestion.value)
                            setShowSuggestions(false)
                          }}
                        >
                          <span className="font-medium">{suggestion.label}</span>
                          {suggestion.description && (
                            <span className="text-xs text-muted-foreground">
                              {suggestion.description}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {detectedPattern && !irregularPatternWarning && (
                  <div className="max-w-md mx-auto mt-3 flex items-center justify-center gap-3 animate-in fade-in duration-300">
                    <button
                      type="button"
                      className="w-9 h-9 rounded-full border-2 border-border hover:border-primary/50 hover:bg-primary/5 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={onPatternRemove}
                      disabled={detectedPattern.count <= 1}
                    >
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <span className="text-sm text-muted-foreground font-medium min-w-[140px] text-center">
                      {detectedPattern.count}x de {detectedPattern.interval} em {detectedPattern.interval} dias
                    </span>
                    <button
                      type="button"
                      className="w-9 h-9 rounded-full border-2 border-border hover:border-primary/50 hover:bg-primary/5 flex items-center justify-center transition-colors"
                      onClick={onPatternAdd}
                    >
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                )}

                <div className="flex justify-center pt-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 underline"
                        >
                          <CalendarDays className="h-3 w-3" />
                          Escolher no calendário
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center">
                        <CalendarComponent
                          mode="single"
                          selected={
                            firstInstallmentDate
                              ? new Date(firstInstallmentDate + 'T12:00:00')
                              : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              const dateStr = date.toISOString().split('T')[0]
                              onFirstInstallmentDateChange(dateStr)
                            }
                          }}
                          locale={ptBR}
                          initialFocus
                          captionLayout="dropdown"
                          fromYear={1900}
                          toYear={2100}
                          disabled={(date) => {
                            if (!saleDate) return false
                            const saleDateObj = new Date(saleDate + 'T00:00:00')
                            const compareDate = new Date(date)
                            compareDate.setHours(0, 0, 0, 0)
                            saleDateObj.setHours(0, 0, 0, 0)
                            return compareDate < saleDateObj
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
              </div>
            </>
          ) : (
            <>
              {/* Modo Simples: Progressive reveal sem stepper */}
              <div className="space-y-2">
                {/* Step 1: Primeira parcela em quantos dias? */}
                <div className="space-y-3 py-3">
                  <Label className="text-base font-medium text-center block mb-4">
                    Primeira parcela em quantos dias?
                  </Label>
                  <div className="flex flex-wrap justify-center gap-2">
                    {!customFirstDays && !showDatePicker ? (
                      <>
                        {[0, 15, 30, 45].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => {
                              setCustomFirstDays(false)
                              setShowDatePicker(false)
                              setFirstDaysChosen(true)
                              onFirstInstallmentDaysChange(n)
                            }}
                            className={cn(
                              'rounded-full border px-3 py-1.5 text-xs font-medium min-h-[36px] transition-all animate-in fade-in zoom-in-95 duration-200',
                              firstDaysChosen && Number(firstInstallmentDays) === n
                                ? 'bg-foreground text-background'
                                : 'bg-background text-foreground border-border'
                            )}
                          >
                            {n === 0 ? 'Hoje' : `${n} dias`}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setShowDatePicker(true)
                            setCustomFirstDays(false)
                            setFirstDaysChosen(false)
                            setDatePickerSelected(false)
                          }}
                          className="rounded-full border px-3 py-1.5 text-xs font-medium min-h-[36px] transition-all flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200 bg-background text-foreground border-border"
                        >
                          <CalendarDays className="h-3.5 w-3.5" />
                          Data
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomFirstDays(true)
                            setShowDatePicker(false)
                            setFirstDaysChosen(true)
                          }}
                          className="rounded-full border px-3 py-1.5 text-xs font-medium min-h-[36px] transition-all bg-background text-foreground border-border animate-in fade-in zoom-in-95 duration-200"
                        >
                          Outro
                        </button>
                      </>
                    ) : (
                      <>
                        {showDatePicker && (
                          <div className="animate-in fade-in slide-in-from-left-2 duration-200">
                            <DatePicker
                              date={
                                datePickerSelected && firstInstallmentDate
                                  ? new Date(firstInstallmentDate + 'T12:00:00')
                                  : undefined
                              }
                              onDateChange={(date) => {
                                if (date) {
                                  const dateStr = date.toISOString().split('T')[0]
                                  onFirstInstallmentDateChange(dateStr)
                                  setDatePickerSelected(true)
                                  setFirstDaysChosen(true)
                                }
                              }}
                              placeholder="Escolher data"
                              disabled={(date) => {
                                if (!saleDate) return false
                                const saleDateObj = new Date(saleDate + 'T00:00:00')
                                const compareDate = new Date(date)
                                compareDate.setHours(0, 0, 0, 0)
                                saleDateObj.setHours(0, 0, 0, 0)
                                return compareDate < saleDateObj
                              }}
                            />
                          </div>
                        )}
                        {customFirstDays && (
                          <NumberStepper
                            value={getSafeNumber(firstInstallmentDays, 0)}
                            onChange={onFirstInstallmentDaysChange}
                            min={0}
                            step={1}
                            suffix="dias"
                            size="sm"
                            className="w-36 animate-in fade-in slide-in-from-left-2 duration-200"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setCustomFirstDays(false)
                            setShowDatePicker(false)
                          }}
                          className="rounded-full border px-2.5 py-1.5 text-xs font-medium min-h-[36px] min-w-[36px] transition-all bg-background text-muted-foreground border-border hover:text-foreground animate-in fade-in zoom-in-95 duration-200"
                        >
                          ...
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Step 2: Quantas parcelas? — always visible, opaque when pending */}
                <div className={cn(
                  'space-y-3 py-[30px] transition-all duration-300',
                  showInstallmentsStep ? 'opacity-100' : 'opacity-30 pointer-events-none'
                )}>
                  <Label className="text-base font-medium text-center block mb-4">
                    Quantas parcelas?
                  </Label>
                  <div className="flex flex-wrap justify-center gap-2">
                    {!customInstallments ? (
                      <>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => {
                              setCustomInstallments(false)
                              setInstallmentsChosen(true)
                              onInstallmentsChange(n)
                            }}
                            className={cn(
                              'rounded-full border px-3 py-1.5 text-xs font-medium min-h-[36px] min-w-[44px] transition-all',
                              !customInstallments && installmentsChosen && safeInstallments === n
                                ? 'bg-foreground text-background'
                                : 'bg-background text-foreground border-border'
                            )}
                          >
                            {n === 1 ? 'À vista' : n}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setCustomInstallments(true)
                            setInstallmentsChosen(true)
                          }}
                          className="rounded-full border px-3 py-1.5 text-xs font-medium min-h-[36px] transition-all bg-background text-foreground border-border"
                        >
                          Outro
                        </button>
                      </>
                    ) : (
                      <>
                        <NumberStepper
                          value={safeInstallments}
                          onChange={onInstallmentsChange}
                          min={1}
                          max={24}
                          step={1}
                          size="sm"
                          className="w-36 animate-in fade-in slide-in-from-left-2 duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setCustomInstallments(false)}
                          className="rounded-full border px-2.5 py-1.5 text-xs font-medium min-h-[36px] min-w-[36px] transition-all bg-background text-muted-foreground border-border hover:text-foreground animate-in fade-in zoom-in-95 duration-200"
                        >
                          ...
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Step 3: Intervalo entre parcelas? — only when >1 installments */}
                {installmentsChosen && isMultipleInstallments && (
                  <div className="space-y-3 py-3 animate-in fade-in duration-300">
                    <Label className="text-base font-medium text-center block mb-4">
                      Intervalo entre parcelas?
                    </Label>
                    <div className="flex flex-wrap justify-center gap-2">
                      {!customInterval ? (
                        <>
                          {[15, 30, 45].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => {
                                setCustomInterval(false)
                                onIntervalChange(n)
                              }}
                              className={cn(
                                'rounded-full border px-3 py-1.5 text-xs font-medium min-h-[36px] transition-all',
                                Number(interval) === n
                                  ? 'bg-foreground text-background'
                                  : 'bg-background text-foreground border-border'
                              )}
                            >
                              {n} dias
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setCustomInterval(true)}
                            className="rounded-full border px-3 py-1.5 text-xs font-medium min-h-[36px] transition-all bg-background text-foreground border-border"
                          >
                            Outro
                          </button>
                        </>
                      ) : (
                        <>
                          <NumberStepper
                            value={getSafeNumber(interval, 1)}
                            onChange={onIntervalChange}
                            min={1}
                            step={1}
                            suffix="dias"
                            size="sm"
                            className="w-36 animate-in fade-in slide-in-from-left-2 duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setCustomInterval(false)}
                            className="rounded-full border px-2.5 py-1.5 text-xs font-medium min-h-[36px] min-w-[36px] transition-all bg-background text-muted-foreground border-border hover:text-foreground animate-in fade-in zoom-in-95 duration-200"
                          >
                            ...
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          </div>

          {/* Linha Separadora com Ícone de Conexão */}
          <div className="relative w-full pt-6 pb-2">
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

          {/* Previsão de recebimento — Stepper Vertical ou Alerta */}
          {irregularPatternWarning ? (
            <div className="pt-4 pb-2">
              <Label className="text-sm font-semibold block mb-4 text-center">
                Previsão de recebimento
              </Label>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-sm text-red-800">{irregularPatternWarning}</p>
              </div>
            </div>
          ) : installmentDates && (() => {
            const safeInst = getSafeNumber(installments, 1)
            const safeInterval = getSafeNumber(interval, 30)
            const safeFirstDays = getSafeNumber(firstInstallmentDays, 30)
            const installmentValue = grossTotal > 0 ? grossTotal / safeInst : 0
            const installmentNetValue = totalValue > 0 ? totalValue / safeInst : 0
            const installmentCommission = totalCommission > 0 ? totalCommission / safeInst : 0
            const taxTotal = grossTotal - totalValue
            const installmentTax = taxTotal > 0 ? taxTotal / safeInst : 0

            const allDates: Date[] = []

            if (customDaysList && customDaysList.length === safeInst) {
              // Irregular pattern: use explicit days from sale date
              const saleDateObj = saleDate ? new Date(saleDate + 'T12:00:00') : new Date()
              for (const days of customDaysList) {
                const d = new Date(saleDateObj)
                d.setDate(d.getDate() + days)
                allDates.push(d)
              }
            } else {
              const baseDate = firstInstallmentDate
                ? new Date(firstInstallmentDate + 'T12:00:00')
                : new Date(calculateDateFromDays(safeFirstDays, saleDate) + 'T12:00:00')

              for (let i = 0; i < safeInst; i++) {
                const d = new Date(baseDate)
                d.setDate(d.getDate() + i * safeInterval)
                allDates.push(d)
              }
            }

            const INITIAL_VISIBLE = 3
            const MAX_SCROLL_VISIBLE = 12
            const initialDates = allDates.slice(0, Math.min(safeInst, INITIAL_VISIBLE))
            const extraDates = allDates.slice(INITIAL_VISIBLE)
            const hasMore = safeInst > INITIAL_VISIBLE
            const needsScroll = expandedPreview && safeInst > MAX_SCROLL_VISIBLE

            const formatCurrency = (value: number) =>
              new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

            const formatDate = (date: Date) =>
              new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)

            return (
              <div className="pt-4 pb-2">
                <Label className="text-sm font-semibold block mb-4 text-center">
                  Previsão de recebimento
                </Label>
                {(() => {
                  const renderStep = (date: Date, idx: number, isLast: boolean) => (
                    <div key={idx} className={cn("relative pl-8", isLast ? "pb-0" : "pb-7")}>
                      {!isLast && (
                        <div className="absolute left-[9px] top-[18px] bottom-0 w-px bg-border" />
                      )}
                      <div className="absolute left-0 top-0 w-[18px] h-[18px] rounded-full bg-muted flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-muted-foreground">{idx + 1}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col pt-[3px]">
                          <span className="text-sm font-medium text-foreground">
                            {formatDate(date)}
                          </span>
                          <span className="text-[10px] text-muted-foreground/50">
                            {(() => {
                              const saleDateObj = saleDate ? new Date(saleDate + 'T12:00:00') : new Date()
                              const diffMs = date.getTime() - saleDateObj.getTime()
                              const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
                              if (diffDays === 0) return 'Hoje'
                              if (diffDays === 1) return 'Amanhã'
                              return `Daqui a ${diffDays} dias`
                            })()}
                          </span>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0">
                          {installmentCommission > 0 ? (
                            <>
                              <span className="text-xs text-muted-foreground/60">
                                {formatCurrency(installmentValue)}
                              </span>
                              <span className="text-lg font-bold text-foreground leading-tight">
                                {formatCurrency(installmentCommission)}
                              </span>
                            </>
                          ) : (
                            <span className="text-base font-semibold text-foreground">
                              {installmentValue > 0 ? formatCurrency(installmentValue) : '-'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )

                  const totalCount = initialDates.length + (expandedPreview ? extraDates.length : 0)

                  return (
                    <div className={cn(needsScroll && 'max-h-[480px] overflow-y-auto pr-1')}>
                      <div className="relative ml-1">
                        {initialDates.map((date, idx) =>
                          renderStep(date, idx, !hasMore && idx === initialDates.length - 1)
                        )}
                        {extraDates.length > 0 && (
                          <div
                            className="overflow-hidden transition-all duration-300 ease-in-out"
                            style={{
                              maxHeight: expandedPreview ? `${extraDates.length * 100}px` : '0px',
                              opacity: expandedPreview ? 1 : 0,
                            }}
                          >
                            {extraDates.map((date, idx) => {
                              const globalIdx = INITIAL_VISIBLE + idx
                              return renderStep(date, globalIdx, globalIdx === allDates.length - 1)
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {hasMore && (
                  <div className="flex justify-center pt-3">
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      onClick={() => setExpandedPreview(!expandedPreview)}
                    >
                      {expandedPreview ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Ver menos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          Ver mais {safeInst - INITIAL_VISIBLE} parcelas
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </CardContent>
    </Card>
  )
}
