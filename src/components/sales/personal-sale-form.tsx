'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { PercentInput } from '@/components/ui/percent-input'
import { NumberStepper } from '@/components/ui/number-stepper'
import { Eye, Save, Wand2, X, Pencil, Trash2 } from 'lucide-react'
import { SaleItemsEditor } from './sale-items-editor'
import { InstallmentsSheet } from './installments-sheet'
import { ClientPicker, ClientDialog } from '@/components/clients'
import { SupplierPicker, SupplierDialog } from '@/components/suppliers'
import { createPersonalSale, updatePersonalSale } from '@/app/actions/personal-sales'
import { addCommissionRule } from '@/app/actions/personal-suppliers'
import { toast } from 'sonner'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import type { Product, PersonalClient } from '@/types'
import type { CreatePersonalSaleItemInput, PersonalSaleWithItems } from '@/types/personal-sale'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type SaleItem = CreatePersonalSaleItemInput & { id: string }

type Props = {
  suppliers: PersonalSupplierWithRules[]
  productsBySupplier: Record<string, Product[]>
  sale?: PersonalSaleWithItems
  mode?: 'create' | 'edit'
}

function parsePaymentCondition(condition: string | null): { type: 'vista' | 'parcelado'; installments: number; interval: number } {
  if (!condition || condition.trim() === '') {
    return { type: 'vista', installments: 3, interval: 30 }
  }

  const parts = condition.split('/').map(p => parseInt(p.trim())).filter(n => !isNaN(n))
  if (parts.length === 0) {
    return { type: 'vista', installments: 3, interval: 30 }
  }

  const interval = parts.length > 1 ? parts[1] - parts[0] : parts[0]
  return {
    type: 'parcelado',
    installments: parts.length,
    interval: interval > 0 ? interval : 30,
  }
}

export function PersonalSaleForm({ suppliers: initialSuppliers, productsBySupplier, sale, mode = 'create' }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const isEdit = mode === 'edit' && !!sale

  const [suppliersList, setSuppliersList] = useState(initialSuppliers)

  const initialPayment = parsePaymentCondition(sale?.payment_condition ?? null)

  const [supplierId, setSupplierId] = useState(sale?.supplier_id || '')
  const [clientId, setClientId] = useState<string | null>(sale?.client_id || null)
  const [clientName, setClientName] = useState(sale?.client_name || '')
  const [saleDate, setSaleDate] = useState(sale?.sale_date || new Date().toISOString().split('T')[0])
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(sale?.first_installment_date || '')
  
  const calculateDateFromDays = (days: number, baseDateStr: string) => {
    const date = new Date(baseDateStr + 'T12:00:00')
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  const calculateDaysFromDate = (targetDateStr: string, baseDateStr: string) => {
    const target = new Date(targetDateStr + 'T12:00:00')
    const base = new Date(baseDateStr + 'T12:00:00')
    const diffTime = Math.abs(target.getTime() - base.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
    return diffDays
  }

  const [paymentType, setPaymentType] = useState<'vista' | 'parcelado'>(initialPayment.type)
  const [installments, setInstallments] = useState<string | number>(initialPayment.installments)
  const [interval, setInterval] = useState<string | number>(initialPayment.interval)
  const [firstInstallmentDays, setFirstInstallmentDays] = useState<string | number>(30)

  const [quickCondition, setQuickCondition] = useState('')
  const [isUpdatingFromQuick, setIsUpdatingFromQuick] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [irregularPatternWarning, setIrregularPatternWarning] = useState<string | null>(null)

  // Opções de autocomplete para condições de pagamento
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

  // Função para detectar padrão irregular
  const detectIrregularPattern = (parts: number[]): { isIrregular: boolean; intervals: number[] } => {
    if (parts.length < 3) return { isIrregular: false, intervals: [] }
    
    const intervals: number[] = []
    for (let i = 1; i < parts.length; i++) {
      intervals.push(parts[i] - parts[i - 1])
    }
    
    // Verifica se todos os intervalos são iguais
    const firstInterval = intervals[0]
    const isIrregular = intervals.some(int => int !== firstInterval)
    
    return { isIrregular, intervals }
  }

  // Filtra sugestões baseado no input
  const filteredSuggestions = paymentConditionSuggestions.filter(suggestion =>
    suggestion.value.startsWith(quickCondition) || 
    suggestion.label.toLowerCase().includes(quickCondition.toLowerCase()) ||
    quickCondition === ''
  )

  const getSafeNumber = (val: string | number, min: number = 0) => {
    if (val === '' || val === undefined || val === null) return min
    const num = typeof val === 'string' ? parseInt(val) : val
    return isNaN(num) ? min : num
  }
  
  useMemo(() => {
    if (paymentType === 'parcelado' && !firstInstallmentDate) {
      const safeInterval = getSafeNumber(interval, 30)
      setFirstInstallmentDate(calculateDateFromDays(safeInterval, saleDate))
      setFirstInstallmentDays(safeInterval)
    } else if (paymentType === 'parcelado' && firstInstallmentDate && saleDate) {
      const days = calculateDaysFromDate(firstInstallmentDate, saleDate)
      setFirstInstallmentDays(days)
    }
  }, [paymentType, saleDate, firstInstallmentDate])

  const handleFirstInstallmentDaysChange = (val: string) => {
    setFirstInstallmentDays(val)
    const days = parseInt(val)
    if (!isNaN(days)) {
      setFirstInstallmentDate(calculateDateFromDays(days, saleDate))
    }
  }

  const handleFirstDateChange = (date: string) => {
    setFirstInstallmentDate(date)
    if (date && saleDate) {
      const days = calculateDaysFromDate(date, saleDate)
      setFirstInstallmentDays(days)
    }
  }

  const handleSaleDateChange = (date: string) => {
    setSaleDate(date)
    if (paymentType === 'parcelado') {
      const days = getSafeNumber(firstInstallmentDays, 30)
      setFirstInstallmentDate(calculateDateFromDays(days, date))
    }
  }

  const handleQuickConditionBlur = () => {
    setShowSuggestions(false)
    setIsUpdatingFromQuick(true)
    
    const normalized = quickCondition.replace(/[\s,-]+/g, '/')
    
    if (normalized.includes('...')) {
        setIsUpdatingFromQuick(false)
        return
    }

    const parts = normalized.split('/').map(p => parseInt(p.trim())).filter(n => !isNaN(n))
    
    if (parts.length > 0) {
      const first = parts[0]
      const count = parts.length
      
      // Detectar padrão irregular ANTES de normalizar
      const { isIrregular, intervals } = detectIrregularPattern(parts)
      
      if (isIrregular && parts.length >= 3) {
        // Mostra alerta com os intervalos detectados
        const uniqueIntervals = [...new Set(intervals)]
        setIrregularPatternWarning(
          `Padrão irregular. Condições comuns seguem intervalos fixos como 30/60/90. Intervalos detectados: ${uniqueIntervals.join(', ')} dias.`
        )
      } else {
        setIrregularPatternWarning(null)
      }
      
      let detectedInterval = getSafeNumber(interval, 30)

      if (parts.length > 1) {
        detectedInterval = parts[1] - parts[0]
      } else if (parts.length === 1 && first > 0) {
         detectedInterval = 30 
      }

      if (detectedInterval <= 0) detectedInterval = 30 

      setInstallments(count)
      setFirstInstallmentDays(first)
      setFirstInstallmentDate(calculateDateFromDays(first, saleDate))
      setInterval(detectedInterval)
      
      setQuickCondition(parts.join('/'))
    }
    
    setTimeout(() => setIsUpdatingFromQuick(false), 100)
  }

  const handleSelectSuggestion = (value: string) => {
    if (value === '0') {
      setPaymentType('vista')
      setShowSuggestions(false)
      return
    }
    setQuickCondition(value)
    setShowSuggestions(false)
    setIrregularPatternWarning(null)
    // Dispara o processamento após um pequeno delay
    setTimeout(() => {
      const parts = value.split('/').map(p => parseInt(p.trim())).filter(n => !isNaN(n))
      if (parts.length > 0) {
        const first = parts[0]
        const detectedInterval = parts.length > 1 ? parts[1] - parts[0] : 30
        setInstallments(parts.length)
        setFirstInstallmentDays(first)
        setFirstInstallmentDate(calculateDateFromDays(first, saleDate))
        setInterval(detectedInterval > 0 ? detectedInterval : 30)
      }
    }, 0)
  }

  useMemo(() => {
    if (isUpdatingFromQuick) {
      return
    }

    if (paymentType === 'parcelado') {
      const safeInstallments = getSafeNumber(installments, 1)
      const safeInterval = getSafeNumber(interval, 30)
      const safeFirstDays = getSafeNumber(firstInstallmentDays, 30)

      if (safeInstallments > 5) {
          const parts = []
          for (let i = 0; i < 3; i++) {
            parts.push(safeFirstDays + (i * safeInterval))
          }
          setQuickCondition(`${parts.join('/')}/... (${safeInstallments}x)`)
      } else {
          const parts = []
          for (let i = 0; i < safeInstallments; i++) {
            parts.push(safeFirstDays + (i * safeInterval))
          }
          setQuickCondition(parts.join('/'))
      }
    }
  }, [installments, interval, firstInstallmentDays, paymentType, isUpdatingFromQuick])

  const [notes, setNotes] = useState(sale?.notes || '')
  const [entryMode, setEntryMode] = useState<'total' | 'items'>(
    sale?.items && sale.items.length > 0 ? 'items' : 'total'
  )
  
  // Estado para múltiplos valores
  type ValueEntry = {
    id: string
    grossValue: string
    taxRate: string
    commissionRate: string
  }
  
  const [valueEntries, setValueEntries] = useState<ValueEntry[]>([
    {
      id: crypto.randomUUID(),
      grossValue: sale?.gross_value?.toString() || '',
      taxRate: sale?.tax_rate?.toString() || '',
      commissionRate: sale?.commission_rate?.toString() || ''
    }
  ])
  
  // Mantém compatibilidade com código existente (usa primeiro entry)
  const grossValueInput = valueEntries[0]?.grossValue || ''
  const setGrossValueInput = (val: string) => {
    setValueEntries(prev => prev.map((entry, idx) => 
      idx === 0 ? { ...entry, grossValue: val } : entry
    ))
  }
  
  const taxRateInput = valueEntries[0]?.taxRate || ''
  const setTaxRateInput = (val: string) => {
    setValueEntries(prev => prev.map((entry, idx) => 
      idx === 0 ? { ...entry, taxRate: val } : entry
    ))
  }
  
  const [selectedRuleId, setSelectedRuleId] = useState<string>('custom')
  const commissionRate = valueEntries[0]?.commissionRate || ''
  const setCommissionRate = (val: string) => {
    setValueEntries(prev => prev.map((entry, idx) => 
      idx === 0 ? { ...entry, commissionRate: val } : entry
    ))
  }
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
  const [showSaveRuleDialog, setShowSaveRuleDialog] = useState(false)
  const [newRuleName, setNewRuleName] = useState('')
  const [savingRule, setSavingRule] = useState(false)
  
  // Estado para modo de edição quando há comissões diferentes nos itens
  const [isEqualizingCommission, setIsEqualizingCommission] = useState(false)
  const [equalizingValue, setEqualizingValue] = useState<number>(0)

  const [items, setItems] = useState<SaleItem[]>(() => {
    if (sale?.items && sale.items.length > 0) {
      return sale.items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate || 0,
        commission_rate: item.commission_rate || 0,
      }))
    }
    return []
  })

  const paymentCondition = paymentType === 'vista'
    ? ''
    : Array.from({ length: getSafeNumber(installments, 1) }, (_, i) => {
        const firstDays = getSafeNumber(firstInstallmentDays, 30)
        const gap = getSafeNumber(interval, 30)
        return firstDays + (i * gap)
      }).join('/')

  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [clientInitialName, setClientInitialName] = useState('')
  const [clientRefreshTrigger, setClientRefreshTrigger] = useState(0)
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const [supplierInitialName, setSupplierInitialName] = useState('')
  const [installmentsSheetOpen, setInstallmentsSheetOpen] = useState(false)

  const selectedProducts = supplierId ? (productsBySupplier[supplierId] || []) : []

  const totalValue = useMemo(() => {
    if (entryMode === 'total') {
      // Soma todos os entries
      return valueEntries.reduce((sum, entry) => {
        const gross = parseFloat(entry.grossValue) || 0
        const taxRate = parseFloat(entry.taxRate) || 0
        return sum + (gross * (1 - (taxRate / 100)))
      }, 0)
    }
    return items.reduce((sum, item) => {
        const gross = item.quantity * item.unit_price
        const tax = gross * ((item.tax_rate || 0) / 100)
        return sum + (gross - tax)
    }, 0)
  }, [items, entryMode, valueEntries])

  const selectedSupplier = useMemo(() => {
    return suppliersList.find((s) => s.id === supplierId)
  }, [suppliersList, supplierId])

  useMemo(() => {
      if (selectedSupplier && !isEdit) {
          const defaultRule = selectedSupplier.default_rule
          if (defaultRule) {
              if (defaultRule.type === 'fixed' && defaultRule.percentage) {
                  setCommissionRate(defaultRule.percentage.toString())
              } else if (defaultRule.type === 'tiered' && defaultRule.tiers?.[0]) {
                  setCommissionRate(defaultRule.tiers[0].percentage.toString())
              }
              // Marca como regra selecionada para não mostrar botão de salvar
              setSelectedRuleId(defaultRule.id)
          } else {
              setCommissionRate('')
              setSelectedRuleId('custom')
          }
      }
  }, [supplierId, isEdit])

  const applyRule = (ruleId: string) => {
      const rule = selectedSupplier?.commission_rules.find(r => r.id === ruleId)
      if (rule) {
          if (rule.type === 'fixed' && rule.percentage) {
              setCommissionRate(rule.percentage.toString())
              toast.success(`Taxa de ${rule.percentage}% aplicada!`)
          } else if (rule.type === 'tiered' && rule.tiers?.[0]) {
              setCommissionRate(rule.tiers[0].percentage.toString())
              toast.success(`Taxa base de ${rule.tiers[0].percentage}% aplicada!`)
          }
      }
      setSelectedRuleId(ruleId)
  }

  const handleCommissionRateChange = (value: string) => {
      setCommissionRate(value)
      if (selectedRuleId !== 'custom') {
          setSelectedRuleId('custom')
      }
  }

  async function handleSaveNewRule() {
      if (!newRuleName.trim()) {
          toast.error('Informe o nome da regra')
          return
      }
      if (!commissionRate || parseFloat(commissionRate) <= 0) {
          toast.error('Informe uma porcentagem válida')
          return
      }

      setSavingRule(true)
      try {
          const result = await addCommissionRule(supplierId, {
              name: newRuleName,
              type: 'fixed',
              percentage: parseFloat(commissionRate),
              tiers: null,
              is_default: false
          })

          if (result.success) {
              toast.success('Regra salva com sucesso!')
              
              setSuppliersList(prev => prev.map(s => {
                  if (s.id === supplierId) {
                      return {
                          ...s,
                          commission_rules: [...s.commission_rules, result.data]
                      }
                  }
                  return s
              }))
              
              setSelectedRuleId(result.data.id)
              setShowSaveRuleDialog(false)
              setNewRuleName('')
          } else {
              toast.error(result.error)
          }
      } catch (error) {
          console.error(error)
          toast.error('Erro ao salvar regra')
      } finally {
          setSavingRule(false)
      }
  }

  const commissionPercentage = useMemo(() => {
    if (commissionRate) return parseFloat(commissionRate)
    return null
  }, [commissionRate])

  // Análise das comissões dos itens
  const itemsCommissionAnalysis = useMemo(() => {
    if (entryMode !== 'items' || items.length === 0) {
      return { hasItems: false, allSame: true, uniqueRates: [], avgRate: 0, totalCommission: 0 }
    }
    
    const rates = items.map(i => i.commission_rate || 0)
    const uniqueRates = [...new Set(rates)]
    const allSame = uniqueRates.length === 1
    
    // Calcula comissão total baseada nos itens
    const totalCommission = items.reduce((sum, item) => {
      const gross = item.quantity * item.unit_price
      const tax = gross * ((item.tax_rate || 0) / 100)
      const net = gross - tax
      return sum + (net * ((item.commission_rate || 0) / 100))
    }, 0)
    
    // Taxa média ponderada
    const avgRate = totalValue > 0 ? (totalCommission / totalValue) * 100 : 0
    
    return {
      hasItems: true,
      allSame,
      uniqueRates,
      avgRate: Math.round(avgRate * 100) / 100,
      totalCommission
    }
  }, [items, entryMode, totalValue])

  // Sincroniza o campo global com os itens quando todos têm mesma comissão
  useMemo(() => {
    if (entryMode === 'items' && items.length > 0 && itemsCommissionAnalysis.allSame) {
      const itemRate = items[0].commission_rate || 0
      if (parseFloat(commissionRate || '0') !== itemRate) {
        setCommissionRate(itemRate.toString())
      }
    }
  }, [items, entryMode, itemsCommissionAnalysis.allSame])

  // Handler para mudança de comissão que propaga para itens se necessário
  const handleGlobalCommissionChange = (value: string) => {
    const newRate = parseFloat(value) || 0
    
    if (entryMode === 'items' && items.length > 0) {
      // Propaga para todos os itens
      const updatedItems = items.map(item => ({
        ...item,
        commission_rate: newRate
      }))
      setItems(updatedItems)
    }
    
    setCommissionRate(value)
    if (selectedRuleId !== 'custom') {
      setSelectedRuleId('custom')
    }
  }
  
  // Handler para quando está no modo "igualar" e edita o valor
  const handleEqualizingCommissionChange = (newValue: number) => {
    // Arredonda para múltiplo de 0.5 mais próximo
    const rounded = Math.round(newValue * 2) / 2
    setEqualizingValue(rounded)
    handleGlobalCommissionChange(rounded.toString())
    setIsEqualizingCommission(false)
    toast.success(`Comissão de ${rounded}% aplicada a todos os itens!`)
  }
  
  // Inicia o modo de igualar
  const startEqualizingMode = () => {
    setEqualizingValue(itemsCommissionAnalysis.avgRate)
    setIsEqualizingCommission(true)
  }
  
  // Cancela o modo de igualar
  const cancelEqualizingMode = () => {
    setIsEqualizingCommission(false)
  }

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
    
    lastDate.setDate(lastDate.getDate() + ((safeInstallments - 1) * safeInterval))
    
    return {
      first: new Intl.DateTimeFormat('pt-BR').format(firstDate),
      last: new Intl.DateTimeFormat('pt-BR').format(lastDate),
    }
  }, [paymentType, installments, interval, firstInstallmentDate, firstInstallmentDays, saleDate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!supplierId) {
      toast.error('Selecione um fornecedor')
      return
    }

    if (!clientId) {
      toast.error('Selecione um cliente')
      return
    }

    if (entryMode === 'items' && items.length === 0) {
      toast.error('Adicione pelo menos um item')
      return
    }

    if (entryMode === 'total' && (!grossValueInput || parseFloat(grossValueInput) <= 0)) {
      toast.error('Informe o valor total da venda')
      return
    }

    if (entryMode === 'items') {
      const invalidItems = items.filter(item => !item.product_name.trim())
      if (invalidItems.length > 0) {
        toast.error('Todos os itens precisam ter nome')
        return
      }
    }

    setSaving(true)

    try {
      const payload = {
        supplier_id: supplierId,
        client_id: clientId,
        client_name: clientName,
        sale_date: saleDate,
        payment_condition: paymentCondition.trim() || undefined,
        first_installment_date: firstInstallmentDate || undefined,
        notes: notes.trim() || undefined,
        gross_value: entryMode === 'total' ? parseFloat(grossValueInput) : undefined,
        tax_rate: entryMode === 'total' ? (parseFloat(taxRateInput) || 0) : undefined,
        commission_rate: commissionRate ? parseFloat(commissionRate) : undefined,
        items: entryMode === 'items' ? items.map(({ product_id, product_name, quantity, unit_price, tax_rate, commission_rate }) => ({
          product_id,
          product_name,
          quantity,
          unit_price,
          tax_rate: tax_rate || 0,
          commission_rate: commission_rate || 0
        })) : [],
      }

      const result = isEdit
        ? await updatePersonalSale(sale.id, payload)
        : await createPersonalSale(payload)

      if (result.success) {
        toast.success(isEdit ? 'Venda atualizada' : 'Venda cadastrada')
        router.push('/minhasvendas')
      } else {
        toast.error(result.error)
      }
    } finally {
      setSaving(false)
    }
  }

  function handleAddValueEntry() {
    setValueEntries(prev => [...prev, {
      id: crypto.randomUUID(),
      grossValue: '',
      taxRate: '',
      commissionRate: ''
    }])
  }

  function handleRemoveValueEntry(id: string) {
    if (valueEntries.length === 1) {
      toast.error('Deve haver pelo menos um valor')
      return
    }
    
    // Inicia animação de saída
    setRemovingIds(prev => new Set(prev).add(id))
    
    // Remove de fato após a animação
    setTimeout(() => {
      setValueEntries(prev => prev.filter(entry => entry.id !== id))
      setRemovingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 300)
  }

  function handleUpdateValueEntry(id: string, field: keyof Omit<ValueEntry, 'id'>, value: string) {
    setValueEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ))
  }

  function handleCancel() {
    router.push('/minhasvendas')
  }

  function handleSupplierChange(value: string) {
    const shouldClearItems = supplierId !== '' && value !== supplierId
    setSupplierId(value)
    if (shouldClearItems) {
      setItems([])
    }
  }

  function handleClientChange(id: string | null, name: string) {
    setClientId(id)
    setClientName(name)
  }

  function handleClientCreated(client: PersonalClient) {
    setClientId(client.id)
    setClientName(client.name)
    setClientRefreshTrigger((prev) => prev + 1)
  }

  function handleSupplierCreated(supplier: PersonalSupplierWithRules) {
    setSuppliersList((prev) => [...prev, supplier])
    // Timeout garante que o Select seja renderizado com a nova lista antes de selecionar
    setTimeout(() => {
      setSupplierId(supplier.id)
    }, 0)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
        
        {/* Bloco 1: Contexto (Quem) */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Iniciais</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <Label htmlFor="supplier">Fornecedor *</Label>
              <SupplierPicker
                suppliers={suppliersList}
                value={supplierId}
                onChange={handleSupplierChange}
                onAddClick={(name) => {
                  setSupplierInitialName(name || '')
                  setSupplierDialogOpen(true)
                }}
                placeholder="Selecione o fornecedor"
              />
            </div>

            <div className="flex-1 space-y-2">
              <Label>Cliente *</Label>
              <ClientPicker
                value={clientId}
                onChange={handleClientChange}
                onAddClick={(name) => {
                  setClientInitialName(name || '')
                  setClientDialogOpen(true)
                }}
                placeholder="Selecionar cliente..."
                refreshTrigger={clientRefreshTrigger}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bloco 2: O Que (Itens + Comissão Global) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>{entryMode === 'total' ? 'Informe o total da venda' : 'Informe os itens da venda'}</CardTitle>
            <RadioGroup
              value={entryMode}
              onValueChange={(v) => setEntryMode(v as 'total' | 'items')}
              className="flex bg-muted p-1 rounded-lg"
            >
              <div className="flex items-center">
                <RadioGroupItem value="total" id="mode-total" className="sr-only" />
                <Label
                  htmlFor="mode-total"
                  className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                    entryMode === 'total' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Total
                </Label>
              </div>
              <div className="flex items-center">
                <RadioGroupItem value="items" id="mode-items" className="sr-only" />
                <Label
                  htmlFor="mode-items"
                  className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                    entryMode === 'items' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Itens
                </Label>
              </div>
            </RadioGroup>
          </CardHeader>
          <CardContent>
            {entryMode === 'total' ? (
              <div className="flex flex-col gap-6">
                
                {/* Corpo: Inputs Centralizados */}
                <div className="flex flex-col items-center gap-4 py-6">
                    
                    {/* Múltiplas Linhas de Valores */}
                    <div className="flex flex-col gap-3 w-full max-w-2xl">
                        {valueEntries.map((entry, index) => (
                            <div 
                                key={entry.id}
                                className="grid transition-[grid-template-rows] duration-300 ease-in-out [grid-template-rows:1fr] data-[new=true]:animate-[grow_0.3s_ease-in-out] data-[removing=true]:[grid-template-rows:0fr]"
                                data-entry-id={entry.id}
                                data-new={index > 0 && entry.grossValue === ''}
                                data-removing={removingIds.has(entry.id)}
                            >
                                <div className="overflow-hidden">
                                    <div className="flex justify-center py-2 relative group animate-in fade-in slide-in-from-top-2 duration-500 delay-150 fill-mode-both data-[removing=true]:animate-out data-[removing=true]:fade-out data-[removing=true]:slide-out-to-top-1 data-[removing=true]:duration-200"
                                         data-removing={removingIds.has(entry.id)}
                                    >
                                        <div className="flex flex-wrap items-end gap-4 relative">
                                            {/* 1. Valor Total */}
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor={`gross_value_${entry.id}`} className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold text-center">Valor Total</Label>
                                                <div className="relative w-40">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">R$</span>
                                                    <Input
                                                        id={`gross_value_${entry.id}`}
                                                        type="text"
                                                        inputMode="decimal"
                                                        placeholder="0,00"
                                                        className="pl-9 h-12 text-xl font-bold text-center shadow-md border-2 focus-visible:ring-0 focus-visible:border-primary rounded-xl"
                                                        value={entry.grossValue}
                                                        onChange={(e) => handleUpdateValueEntry(entry.id, 'grossValue', e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                                                    />
                                                </div>
                                            </div>

                                            {/* 2. Impostos - Borda Laranja */}
                                            <div className="flex flex-col gap-2">
                                                <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold text-center">Impostos</Label>
                                                <PercentInput
                                                    value={entry.taxRate ? parseFloat(entry.taxRate) : 0}
                                                    onChange={(val) => handleUpdateValueEntry(entry.id, 'taxRate', String(val))}
                                                    min={0}
                                                    max={100}
                                                    step={0.5}
                                                    decimals={2}
                                                    className="w-28 [&>input]:border-l-4 [&>input]:border-l-[#f59e0b]"
                                                />
                                            </div>

                                            {/* 3. Comissão - Borda Verde */}
                                            <div className="flex flex-col gap-2">
                                                <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold text-center">Comissão</Label>
                                                <div className="flex items-center gap-2">
                                                    <PercentInput
                                                        value={entry.commissionRate ? parseFloat(entry.commissionRate) : 0}
                                                        onChange={(val) => handleUpdateValueEntry(entry.id, 'commissionRate', String(val))}
                                                        min={0}
                                                        max={100}
                                                        step={0.5}
                                                        decimals={2}
                                                        className="w-28 [&>input]:border-l-4 [&>input]:border-l-[#67C23A]"
                                                    />

                                                    {index === 0 && selectedSupplier && selectedSupplier.commission_rules.length > 0 && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 border-dashed border-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all rounded-xl">
                                                                    <Wand2 className="h-5 w-5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-56">
                                                                <DropdownMenuLabel>Regras Salvas</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                {selectedSupplier.commission_rules.map(rule => (
                                                                    <DropdownMenuItem key={rule.id} onClick={() => applyRule(rule.id)} className="flex justify-between items-center cursor-pointer">
                                                                        <span>{rule.name}</span>
                                                                        <span className="font-bold text-muted-foreground">
                                                                            {rule.type === 'fixed' ? `${rule.percentage}%` : `${rule.tiers?.[0]?.percentage}%`}
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
                                                    onClick={() => handleRemoveValueEntry(entry.id)}
                                                    className="absolute -right-7 bottom-3.5 p-1 text-destructive/40 hover:text-destructive transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
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

                    {/* Botão Adicionar Valor - com transição suave */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-dashed border-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-300"
                        onClick={handleAddValueEntry}
                    >
                        + Adicionar valor
                    </Button>
                </div>

              </div>
            ) : (
              <SaleItemsEditor
                products={selectedProducts}
                value={items}
                onChange={setItems}
                supplierId={supplierId}
                defaultCommissionRate={commissionRate ? parseFloat(commissionRate) : 0}
              />
            )}
          </CardContent>
          
          {/* Rodapé com Totais - Apenas no modo Total */}
          {entryMode === 'total' && (
            <CardFooter className="flex flex-col gap-4 pt-6">
              {/* Linha Separadora com Ícone de Conexão */}
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center">
                  <div className="bg-background px-3">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Grid de Totais */}
              <div className="grid grid-cols-3 gap-4 w-full">
                {/* Total Geral */}
                <div className="flex flex-col items-center gap-1 p-3 bg-muted/30 rounded-lg">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total</span>
                  <span className="text-lg font-bold text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      valueEntries.reduce((sum, entry) => sum + (parseFloat(entry.grossValue) || 0), 0)
                    )}
                  </span>
                </div>

                {/* Base de Cálculo */}
                <div className="flex flex-col items-center gap-1 p-3 bg-muted/30 rounded-lg">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Base de Cálculo</span>
                  <span className="text-lg font-bold text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                  </span>
                </div>

                {/* Comissão */}
                <div className="flex flex-col items-center gap-1 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Comissão</span>
                  <span className="text-lg font-bold text-emerald-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      valueEntries.reduce((sum, entry) => {
                        const gross = parseFloat(entry.grossValue) || 0
                        const taxRate = parseFloat(entry.taxRate) || 0
                        const commRate = parseFloat(entry.commissionRate) || 0
                        const base = gross * (1 - (taxRate / 100))
                        return sum + (base * (commRate / 100))
                      }, 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Atalho para Salvar Regra */}
              {commissionRate && parseFloat(commissionRate) > 0 && selectedRuleId === 'custom' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 self-center"
                  onClick={() => setShowSaveRuleDialog(true)}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Salvar como regra
                </Button>
              )}
            </CardFooter>
          )}
          
          {/* Rodapé de Comissão Removido (integrado acima no entryMode === 'total') */}
          {supplierId && entryMode === 'items' && (
            <CardFooter className="flex flex-col items-center border-t bg-muted/20 py-8 space-y-6">
                
                {/* Header da Comissão (Apenas para modo Itens) */}
                <div className="relative w-full flex justify-center">
                    <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Comissão dos Itens
                    </Label>
                    {isEqualizingCommission && (
                      <button
                        type="button"
                        onClick={cancelEqualizingMode}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Manter comissões personalizadas"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                </div>

                <div className="flex flex-col items-center gap-4">
                    {itemsCommissionAnalysis.hasItems && !itemsCommissionAnalysis.allSame && !isEqualizingCommission ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="text-4xl font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
                          onClick={startEqualizingMode}
                        >
                          {itemsCommissionAnalysis.avgRate.toFixed(1).replace('.', ',')}%
                        </button>
                        <button
                          type="button"
                          onClick={startEqualizingMode}
                          className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                          title="Editar comissão"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <PercentInput
                          value={isEqualizingCommission ? equalizingValue : (commissionRate ? parseFloat(commissionRate) : 0)}
                          onChange={(val) => isEqualizingCommission ? handleEqualizingCommissionChange(val) : handleGlobalCommissionChange(String(val))}
                          min={0}
                          max={100}
                          step={0.5}
                          decimals={2}
                          className="w-40"
                        />
                      </div>
                    )}
                </div>

                <div className="flex flex-col items-center gap-2">
                    {(() => {
                      const commissionToShow = itemsCommissionAnalysis.totalCommission;
                      return commissionToShow > 0 ? (
                        <div className="bg-emerald-50 text-emerald-900 px-6 py-3 rounded-full border border-emerald-100 flex items-center gap-3 shadow-sm animate-in zoom-in-95 duration-300">
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">A Receber</span>
                            <span className="text-2xl font-bold tracking-tight">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commissionToShow)}
                            </span>
                        </div>
                      ) : (
                        <div className="h-12 flex items-center text-muted-foreground/50 text-sm italic">
                            Adicione itens para calcular comissão
                        </div>
                      )
                    })()}
                </div>
            </CardFooter>
          )}
        </Card>

        {/* Bloco 3: Financeiro (Pagamento) */}
        <Card>
          <CardHeader>
            <CardTitle>Condições de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
             
            {/* Data da Venda (Âncora Temporal) */}
             <div className="flex flex-col items-center justify-center space-y-3 mb-6">
                <Label htmlFor="date" className="text-muted-foreground text-sm uppercase tracking-wide font-bold">Data da Venda</Label>
                <div className="relative">
                    <Input
                        id="date"
                        type="date"
                        value={saleDate}
                        onChange={(e) => handleSaleDateChange(e.target.value)}
                        className="w-auto min-w-[200px] text-center font-bold text-lg h-12 shadow-sm border-2 focus-visible:ring-0 focus-visible:border-primary px-4"
                    />
                </div>
             </div>

             {/* Separador Visual Customizado */}
             <div className="flex items-center justify-center gap-4 mb-8 opacity-50">
                <div className="h-px bg-border w-12"></div>
                <div className="h-1 w-1 rounded-full bg-border"></div>
                <div className="h-px bg-border w-12"></div>
             </div>

             {/* Seletor de Tipo */}
             <div className="flex justify-center mb-8">
                <RadioGroup
                value={paymentType}
                onValueChange={(v) => setPaymentType(v as 'vista' | 'parcelado')}
                className="flex gap-2 bg-muted p-1 rounded-full"
                >
                <div className="flex items-center">
                    <RadioGroupItem value="vista" id="vista" className="sr-only" />
                    <Label 
                        htmlFor="vista" 
                        className={`px-6 py-2 text-sm font-medium rounded-full cursor-pointer transition-all ${
                            paymentType === 'vista' ? 'bg-background shadow-sm text-foreground ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'
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
                            paymentType === 'parcelado' ? 'bg-background shadow-sm text-foreground ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                    Parcelado
                    </Label>
                </div>
                </RadioGroup>
            </div>

            {paymentType === 'parcelado' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                
                {/* 1. O Comando (Input Rápido com Autocomplete) */}
                <div className="space-y-3">
                    <Label htmlFor="quick_condition" className="text-sm font-medium text-center block text-primary">
                        Digite os prazos (ex: 30/60/90)
                    </Label>
                    <div className="relative max-w-md mx-auto">
                        <Input
                            id="quick_condition"
                            placeholder="30/60/90"
                            value={quickCondition}
                            onChange={(e) => {
                              setQuickCondition(e.target.value)
                              setIsUpdatingFromQuick(true)
                              setIrregularPatternWarning(null)
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={(e) => {
                              // Delay para permitir clique nas sugestões
                              setTimeout(() => {
                                setShowSuggestions(false)
                                handleQuickConditionBlur()
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
                                  handleSelectSuggestion(suggestion.value)
                                }}
                              >
                                <span className="font-medium">{suggestion.label}</span>
                                {suggestion.description && (
                                  <span className="text-xs text-muted-foreground">{suggestion.description}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                    
                    {/* Alerta de Padrão Irregular */}
                    {irregularPatternWarning && (
                      <div className="max-w-md mx-auto mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm text-amber-800">{irregularPatternWarning}</p>
                          <button
                            type="button"
                            className="mt-1 text-xs text-amber-600 hover:text-amber-700 underline"
                            onClick={() => setIrregularPatternWarning(null)}
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
                    <div className="text-xs uppercase tracking-widest font-semibold">Configuração Avançada</div>
                    <div className="h-px bg-border flex-1"></div>
                </div>

                {/* 3. A Mecânica (Box Técnico) */}
                <div className="bg-muted/40 rounded-xl p-6 border border-border/50 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">
                        Qtd.
                        </Label>
                        <NumberStepper
                          value={typeof installments === 'number' ? installments : parseInt(String(installments)) || 1}
                          onChange={(val) => setInstallments(val)}
                          min={1}
                          max={24}
                          step={1}
                          size="sm"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">
                        Intervalo
                        </Label>
                        <NumberStepper
                          value={typeof interval === 'number' ? interval : parseInt(String(interval)) || 30}
                          onChange={(val) => setInterval(val)}
                          min={1}
                          step={5}
                          size="sm"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">
                        1ª em (dias)
                        </Label>
                        <NumberStepper
                          value={typeof firstInstallmentDays === 'number' ? firstInstallmentDays : parseInt(String(firstInstallmentDays)) || 30}
                          onChange={(val) => {
                            setFirstInstallmentDays(val)
                            setFirstInstallmentDate(calculateDateFromDays(val, saleDate))
                          }}
                          min={0}
                          step={5}
                          size="sm"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="first_installment_date" className="text-[10px] uppercase text-muted-foreground font-bold">
                        Data 1ª
                        </Label>
                        <Input
                        id="first_installment_date"
                        type="date"
                        required
                        className="h-9 bg-background px-2 text-xs"
                        value={firstInstallmentDate}
                        onChange={(e) => handleFirstDateChange(e.target.value)}
                        />
                    </div>
                </div>

                {/* 4. O Resultado (Lista Limpa e Primária) */}
                {installmentDates && (
                    <div className="pt-4">
                        <Label className="text-sm font-semibold block mb-4 text-center">
                            Previsão de Recebimento
                        </Label>
                        <div className="bg-card rounded-lg border shadow-sm divide-y">
                            {(() => {
                                const safeInstallments = getSafeNumber(installments, 1);
                                const safeInterval = getSafeNumber(interval, 30);
                                const safeFirstDays = getSafeNumber(firstInstallmentDays, 30);
                                const installmentValue = totalValue > 0 ? totalValue / safeInstallments : 0;
                                
                                const dates = [];
                                const baseDate = firstInstallmentDate ? new Date(firstInstallmentDate + 'T12:00:00') : new Date(calculateDateFromDays(safeFirstDays, saleDate) + 'T12:00:00');
                                
                                for(let i=0; i < Math.min(safeInstallments, 4); i++) {
                                    const d = new Date(baseDate);
                                    d.setDate(d.getDate() + (i * safeInterval));
                                    dates.push(d);
                                }

                                return (
                                    <>
                                        {dates.map((date, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 hover:bg-muted/20 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-sm font-medium">
                                                        {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date)}
                                                    </span>
                                                </div>
                                                <span className="font-bold text-sm">
                                                    {installmentValue > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(installmentValue) : '-'}
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
                                                    onClick={() => setInstallmentsSheetOpen(true)}
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    Ver mais {safeInstallments - 4} parcelas...
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
            )}
          </CardContent>
        </Card>

        {/* Bloco 4: Observações (Colapsado ou Full Width) */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações sobre a venda..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 pb-10">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving} size="lg">
            {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Salvar Venda'}
          </Button>
        </div>
      </form>

      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onSuccess={handleClientCreated}
        initialName={clientInitialName}
      />

      <SupplierDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        onSuccess={handleSupplierCreated}
        initialName={supplierInitialName}
      />

      <InstallmentsSheet
        open={installmentsSheetOpen}
        onOpenChange={setInstallmentsSheetOpen}
        saleDate={saleDate}
        installments={getSafeNumber(installments, 1)}
        interval={getSafeNumber(interval, 30)}
        totalValue={totalValue}
        commissionPercentage={commissionPercentage}
      />

      {/* Dialog para salvar nova regra */}
      <Dialog open={showSaveRuleDialog} onOpenChange={setShowSaveRuleDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Salvar Nova Regra</DialogTitle>
            <DialogDescription>
              Crie uma regra para reutilizar esta taxa de {commissionRate}% no futuro.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Nome da Regra</Label>
              <Input
                id="rule-name"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder="Ex: Promoção de Natal"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowSaveRuleDialog(false)}>
                Cancelar
            </Button>
            <Button type="button" onClick={handleSaveNewRule} disabled={savingRule}>
              {savingRule ? 'Salvando...' : 'Salvar Regra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
