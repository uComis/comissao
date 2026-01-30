import { useMemo, useState } from 'react'
import { Calendar, CalendarDays, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
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
  totalValue: number
  onSaleDateChange: (date: string) => void
  onFirstInstallmentDateChange: (date: string) => void
  onInstallmentsChange: (value: number) => void
  onIntervalChange: (value: number) => void
  onFirstInstallmentDaysChange: (value: number) => void
  onQuickConditionChange: (value: string) => void
  onQuickConditionBlur: () => void
  onSelectSuggestion: (value: string) => void
  onDismissWarning: () => void
  onViewAllInstallments: () => void
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
  totalValue,
  onSaleDateChange,
  onFirstInstallmentDateChange,
  onInstallmentsChange,
  onIntervalChange,
  onFirstInstallmentDaysChange,
  onQuickConditionChange,
  onQuickConditionBlur,
  onSelectSuggestion,
  onDismissWarning,
  onViewAllInstallments,
}: PaymentConditionSectionProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
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
    if (firstInstallmentDate) {
      firstDate = new Date(firstInstallmentDate + 'T12:00:00')
    } else {
      const safeFirstDays = getSafeNumber(firstInstallmentDays, 30)
      firstDate = new Date(calculateDateFromDays(safeFirstDays, saleDate) + 'T12:00:00')
    }

    const lastDate = new Date(firstDate)
    lastDate.setDate(lastDate.getDate() + (safeInst - 1) * safeInterval)

    return {
      first: new Intl.DateTimeFormat('pt-BR').format(firstDate),
      last: new Intl.DateTimeFormat('pt-BR').format(lastDate),
    }
  }, [installments, interval, firstInstallmentDate, firstInstallmentDays, saleDate])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Condições de Pagamento</CardTitle>
        <div className="flex gap-1 bg-muted p-0.5 rounded-full">
          <button
            type="button"
            onClick={() => {
              setParceladoMode('simples')
              setFirstDaysChosen(false)
              setInstallmentsChosen(false)
              setDatePickerSelected(false)
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
                {showDatePicker && (
                  <div className="flex flex-col items-center gap-2 pb-2">
                    <DatePicker
                      date={
                        firstInstallmentDate
                          ? new Date(firstInstallmentDate + 'T12:00:00')
                          : undefined
                      }
                      onDateChange={(date) => {
                        if (date) {
                          const dateStr = date.toISOString().split('T')[0]
                          onFirstInstallmentDateChange(dateStr)
                        }
                      }}
                      placeholder="Data da 1ª parcela"
                      disabled={(date) => {
                        if (!saleDate) return false
                        const saleDateObj = new Date(saleDate + 'T00:00:00')
                        const compareDate = new Date(date)
                        compareDate.setHours(0, 0, 0, 0)
                        saleDateObj.setHours(0, 0, 0, 0)
                        return compareDate < saleDateObj
                      }}
                    />
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                      onClick={() => setShowDatePicker(false)}
                    >
                      usar dias
                    </button>
                  </div>
                )}
                <div className="relative max-w-md mx-auto">
                  <Input
                    id="quick_condition"
                    placeholder="ex: 0 (à vista) ou 30/60/90"
                    value={quickCondition}
                    onChange={(e) => onQuickConditionChange(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowSuggestions(false)
                        onQuickConditionBlur()
                      }, 150)
                    }}
                    className={`h-14 text-xl font-medium text-center border-2 focus-visible:ring-0 shadow-sm ${
                      irregularPatternWarning
                        ? 'border-amber-400 focus-visible:border-amber-500'
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

                {irregularPatternWarning && (
                  <div className="max-w-md mx-auto mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <svg
                      className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
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
                    <div className="flex-1">
                      <p className="text-sm text-amber-800">{irregularPatternWarning}</p>
                      <button
                        type="button"
                        className="mt-1 text-xs text-amber-600 hover:text-amber-700 underline"
                        onClick={onDismissWarning}
                      >
                        Entendi, continuar assim
                      </button>
                    </div>
                  </div>
                )}

                {!showDatePicker && (
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 underline"
                      onClick={() => setShowDatePicker(true)}
                    >
                      <CalendarDays className="h-3 w-3" />
                      ou escolher data da 1ª parcela
                    </button>
                  </div>
                )}
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

          {/* Previsão de Recebimento */}
          {installmentDates && (
            <div className="pt-4 pb-6">
              <Label className="text-sm font-semibold block mb-4 text-center">
                Previsão de Recebimento
              </Label>
              <div className="bg-card rounded-lg border shadow-sm divide-y">
                {(() => {
                  const safeInst = getSafeNumber(installments, 1)
                  const safeInterval = getSafeNumber(interval, 30)
                  const safeFirstDays = getSafeNumber(firstInstallmentDays, 30)
                  const installmentValue = totalValue > 0 ? totalValue / safeInst : 0

                  const dates = []
                  const baseDate = firstInstallmentDate
                    ? new Date(firstInstallmentDate + 'T12:00:00')
                    : new Date(calculateDateFromDays(safeFirstDays, saleDate) + 'T12:00:00')

                  for (let i = 0; i < Math.min(safeInst, 4); i++) {
                    const d = new Date(baseDate)
                    d.setDate(d.getDate() + i * safeInterval)
                    dates.push(d)
                  }

                  return (
                    <>
                      {dates.map((date, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-medium">
                              {new Intl.DateTimeFormat('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              }).format(date)}
                            </span>
                          </div>
                          <span className="font-bold text-sm">
                            {installmentValue > 0
                              ? new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(installmentValue)
                              : '-'}
                          </span>
                        </div>
                      ))}

                      {safeInst > 4 && (
                        <div className="p-2 bg-muted/20 text-center">
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="text-xs h-auto py-1"
                            onClick={onViewAllInstallments}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver mais {safeInst - 4} parcelas...
                          </Button>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
