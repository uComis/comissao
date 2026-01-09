import { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DatePicker } from '@/components/ui/date-picker'
import { NumberStepper } from '@/components/ui/number-stepper'
import { cn } from '@/lib/utils'

type PaymentConditionSectionProps = {
  saleDate: string
  firstInstallmentDate: string
  paymentType: 'vista' | 'parcelado'
  installments: string | number
  interval: string | number
  firstInstallmentDays: string | number
  quickCondition: string
  irregularPatternWarning: string | null
  totalValue: number
  onSaleDateChange: (date: string) => void
  onFirstInstallmentDateChange: (date: string) => void
  onPaymentTypeChange: (type: 'vista' | 'parcelado') => void
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
  paymentType,
  installments,
  interval,
  firstInstallmentDays,
  quickCondition,
  irregularPatternWarning,
  totalValue,
  onSaleDateChange,
  onFirstInstallmentDateChange,
  onPaymentTypeChange,
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

  const filteredSuggestions = paymentConditionSuggestions.filter(
    (suggestion) =>
      suggestion.value.startsWith(quickCondition) ||
      suggestion.label.toLowerCase().includes(quickCondition.toLowerCase()) ||
      quickCondition === ''
  )

  const installmentDates = useMemo(() => {
    if (paymentType !== 'parcelado') return null

    const safeInstallments = getSafeNumber(installments, 1)
    const safeInterval = getSafeNumber(interval, 30)

    let firstDate: Date
    if (firstInstallmentDate) {
      firstDate = new Date(firstInstallmentDate + 'T12:00:00')
    } else {
      const safeFirstDays = getSafeNumber(firstInstallmentDays, 30)
      firstDate = new Date(calculateDateFromDays(safeFirstDays, saleDate) + 'T12:00:00')
    }

    const lastDate = new Date(firstDate)
    lastDate.setDate(lastDate.getDate() + (safeInstallments - 1) * safeInterval)

    return {
      first: new Intl.DateTimeFormat('pt-BR').format(firstDate),
      last: new Intl.DateTimeFormat('pt-BR').format(lastDate),
    }
  }, [paymentType, installments, interval, firstInstallmentDate, firstInstallmentDays, saleDate])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Condições de Pagamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-muted-foreground text-[10px] font-bold">
              Data da Venda
            </Label>
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

          <div className="space-y-2">
            <Label
              htmlFor="first_installment_date_footer"
              className="text-muted-foreground text-[10px] font-bold"
            >
              {paymentType === 'vista' ? 'Data de Recebimento' : 'Data da 1ª Parcela'}
            </Label>
            <DatePicker
              date={
                firstInstallmentDate ? new Date(firstInstallmentDate + 'T12:00:00') : undefined
              }
              onDateChange={(date) => {
                if (date) {
                  const dateStr = date.toISOString().split('T')[0]
                  onFirstInstallmentDateChange(dateStr)
                }
              }}
              placeholder={
                paymentType === 'vista'
                  ? 'Selecione a data de recebimento'
                  : 'Selecione a data da 1ª parcela'
              }
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
        </div>

        {/* Seletor de Tipo */}
        <div className="flex justify-center py-4">
          <RadioGroup
            value={paymentType}
            onValueChange={(v) => onPaymentTypeChange(v as 'vista' | 'parcelado')}
            className="flex gap-2 bg-muted p-1 rounded-full"
          >
            <div className="flex items-center">
              <RadioGroupItem value="vista" id="vista" className="sr-only" />
              <Label
                htmlFor="vista"
                className={`px-6 py-2 text-sm font-medium rounded-full cursor-pointer transition-all ${
                  paymentType === 'vista'
                    ? 'bg-background shadow-sm text-foreground ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                À vista
              </Label>
            </div>
            <div className="flex items-center">
              <RadioGroupItem value="parcelado" id="parcelado" className="sr-only" />
              <Label
                htmlFor="parcelado"
                className={`px-6 py-2 text-sm font-medium rounded-full cursor-pointer transition-all ${
                  paymentType === 'parcelado'
                    ? 'bg-background shadow-sm text-foreground ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Parcelado
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div
          className={cn(
            'grid transition-all duration-500 ease-in-out overflow-hidden',
            paymentType === 'parcelado'
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0'
          )}
        >
          <div className="min-h-0">
            <div className="max-w-2xl mx-auto space-y-6 pt-6 animate-in fade-in slide-in-from-top-4 duration-500 fill-mode-both">
              {/* 1. O Comando (Input Rápido com Autocomplete) */}
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
                    placeholder="ex: 30/60/90"
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

                  {/* Autocomplete Dropdown */}
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

                {/* Alerta de Padrão Irregular */}
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
              </div>

              {/* 2. A Conexão */}
              <div className="flex items-center justify-center gap-4 text-muted-foreground/30">
                <div className="h-px bg-border flex-1"></div>
                <div className="text-xs font-semibold">Detalhes do Prazo</div>
                <div className="h-px bg-border flex-1"></div>
              </div>

              {/* 3. A Mecânica (Box Técnico) */}
              <div className="bg-muted/40 rounded-xl p-6 border border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] uppercase text-foreground/50 font-bold mb-1 block px-1">
                    Número de Parcelas
                  </Label>
                  <NumberStepper
                    value={Number(installments) || 1}
                    onChange={onInstallmentsChange}
                    min={1}
                    max={24}
                    step={1}
                    size="sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] uppercase text-foreground/50 font-bold mb-1 block px-1">
                    Intervalo em dias
                  </Label>
                  <NumberStepper
                    value={Number(interval) || 30}
                    onChange={onIntervalChange}
                    min={1}
                    step={5}
                    size="sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] uppercase text-foreground/50 font-bold mb-1 block px-1">
                    1ª Parcela em Dias
                  </Label>
                  <NumberStepper
                    value={Number(firstInstallmentDays) || 30}
                    onChange={onFirstInstallmentDaysChange}
                    min={0}
                    step={5}
                    size="sm"
                  />
                </div>
              </div>

              {/* 4. O Resultado (Lista Limpa e Primária) */}
              {installmentDates && (
                <div className="pt-4 pb-6">
                  <Label className="text-sm font-semibold block mb-4 text-center">
                    Previsão de Recebimento
                  </Label>
                  <div className="bg-card rounded-lg border shadow-sm divide-y">
                    {(() => {
                      const safeInstallments = getSafeNumber(installments, 1)
                      const safeInterval = getSafeNumber(interval, 30)
                      const safeFirstDays = getSafeNumber(firstInstallmentDays, 30)
                      const installmentValue = totalValue > 0 ? totalValue / safeInstallments : 0

                      const dates = []
                      const baseDate = firstInstallmentDate
                        ? new Date(firstInstallmentDate + 'T12:00:00')
                        : new Date(calculateDateFromDays(safeFirstDays, saleDate) + 'T12:00:00')

                      for (let i = 0; i < Math.min(safeInstallments, 4); i++) {
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

                          {safeInstallments > 4 && (
                            <div className="p-2 bg-muted/20 text-center">
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="text-xs h-auto py-1"
                                onClick={onViewAllInstallments}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver mais {safeInstallments - 4} parcelas...
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
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
