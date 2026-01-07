'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CompactNumberInput } from '@/components/ui/compact-number-input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { NumberStepper } from '@/components/ui/number-stepper'
import { Eye, Wand2, Trash2, Search, Plus, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter as SheetFooterUI,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { InstallmentsSheet } from './installments-sheet'
import { ClientPicker, ClientDialog } from '@/components/clients'
import { SupplierPicker, SupplierDialog } from '@/components/suppliers'
import { createPersonalSale, updatePersonalSale } from '@/app/actions/personal-sales'
import { updateProduct } from '@/app/actions/products'
import { updatePersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import { toast } from 'sonner'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import type { Product, PersonalClient, CommissionRule } from '@/types'
import type { PersonalSaleWithItems } from '@/types/personal-sale'
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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

type ValueEntry = {
  id: string
  quantity: number
  grossValue: string
  taxRate: string
  commissionRate: string
  productId?: string | null
  productName?: string
}

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
  const [informItems, setInformItems] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Mobile Drawer State
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
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
  const isEdit = mode === 'edit' && !!sale

  const [suppliersList, setSuppliersList] = useState(initialSuppliers)

  const initialPayment = parsePaymentCondition(sale?.payment_condition ?? null)

  const [supplierId, setSupplierId] = useState(sale?.supplier_id || '')
  const [clientId, setClientId] = useState<string | null>(sale?.client_id || null)
  const [clientName, setClientName] = useState(sale?.client_name || '')
  const today = new Date().toISOString().split('T')[0]
  const [saleDate, setSaleDate] = useState(sale?.sale_date || today)
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(
    sale?.first_installment_date || (initialPayment.type === 'vista' ? (sale?.sale_date || today) : '')
  )
  
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
  const [hasChangedSteppers, setHasChangedSteppers] = useState(false)
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
    } else {
      // Para vendas à vista, a data de recebimento por padrão acompanha a venda
      setFirstInstallmentDate(date)
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

    // Se for venda nova e o usuário ainda não mexeu nos steppers, deixa o quickCondition vazio
    if (!sale && !hasChangedSteppers && !quickCondition) {
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
  }, [installments, interval, firstInstallmentDays, paymentType, isUpdatingFromQuick, sale, hasChangedSteppers, quickCondition])

  const [notes, setNotes] = useState(sale?.notes || '')
  const [valueEntries, setValueEntries] = useState<ValueEntry[]>(() => {
    if (sale?.items && sale.items.length > 0) {
      return sale.items.map(item => ({
        id: item.id,
        quantity: item.quantity || 1,
        grossValue: item.unit_price.toString(),
        taxRate: (item.tax_rate || 0).toString(),
        commissionRate: (item.commission_rate || 0).toString(),
        productId: item.product_id,
        productName: item.product_name
      }))
    }
    return [
      {
        id: crypto.randomUUID(),
        quantity: 1,
        grossValue: sale?.gross_value?.toString() || '',
        taxRate: sale?.tax_rate?.toString() || '',
        commissionRate: sale?.commission_rate?.toString() || ''
      }
    ]
  })
  
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
  const [productSearchOpen, setProductSearchOpen] = useState<{ open: boolean; entryId?: string }>({ open: false })
  const [productSearchQuery, setProductSearchQuery] = useState('')


  // Removido estado items e lógica itemsCommissionAnalysis que dependia de entryMode

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
    // Agora sempre soma todos os entries (venda consolidada)
    return valueEntries.reduce((sum, entry) => {
      const quantity = informItems ? (entry.quantity || 1) : 1
      const gross = parseFloat(entry.grossValue) || 0
      const taxRate = parseFloat(entry.taxRate) || 0
      return sum + (quantity * gross * (1 - (taxRate / 100)))
    }, 0)
  }, [valueEntries, informItems])



  const selectedSupplier = useMemo(() => {
    return suppliersList.find((s) => s.id === supplierId)
  }, [suppliersList, supplierId])

  const applyRule = (ruleId: string) => {
      const rule = selectedSupplier?.commission_rules.find(r => r.id === ruleId)
      if (rule) {
          if (rule.type === 'fixed' && rule.percentage) {
              // Aplica na primeira linha por padrão ou na linha selecionada no futuro
              handleUpdateValueEntry(valueEntries[0].id, 'commissionRate', rule.percentage.toString())
              toast.success(`Taxa de ${rule.percentage}% aplicada!`)
          }
      }
  }

  // handleCommissionRateChange was removed as it's no longer used for a single field

  const calculateTieredRate = (rule: CommissionRule, value: number) => {
    if (!rule.tiers || rule.tiers.length === 0) return rule.percentage || 0
    
    // Encontrar a faixa correspondente
    const tier = rule.tiers.find((t) => {
        const minMatches = value >= t.min
        const maxMatches = t.max === null || value <= t.max
        return minMatches && maxMatches
    })
    
    return tier ? tier.percentage : (rule.tiers[rule.tiers.length - 1].percentage || 0)
  }

  const getEffectiveRate = (entryId: string, target: 'commission' | 'tax', currentGross?: string, currentProductId?: string | null) => {
    const entry = valueEntries.find(e => e.id === entryId)
    if (!entry) return 0

    const gross = parseFloat(currentGross !== undefined ? currentGross : entry.grossValue) || 0
    const productId = currentProductId !== undefined ? currentProductId : entry.productId

    // 1. Produto
    if (productId) {
      const product = selectedProducts.find(p => p.id === productId)
      if (product) {
        // a) Regra de Faixa do Produto
        if (product.commission_rule_id) {
            const rule = selectedSupplier?.commission_rules.find(r => r.id === product.commission_rule_id)
            if (rule && rule.target === target && rule.type === 'tiered') {
                return calculateTieredRate(rule, gross)
            }
        }
        // b) Valor Fixo do Produto
        const fixed = target === 'commission' ? product.default_commission_rate : product.default_tax_rate
        if (fixed !== null) return fixed
      }
    }

    // 2. Pasta (Fornecedor)
    if (selectedSupplier) {
        // a) Regra de Faixa da Pasta (Default para o target)
        const supplierRule = selectedSupplier.commission_rules.find(r => r.target === target && r.type === 'tiered' && r.is_default)
        if (supplierRule) {
            return calculateTieredRate(supplierRule, gross)
        }

        // b) Valor Fixo da Pasta
        const fixed = target === 'commission' ? selectedSupplier.default_commission_rate : selectedSupplier.default_tax_rate
        return fixed || 0
    }

    return 0
  }


  // Removidas funções de equalização de comissão

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

    // Validação básica

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
        // Agora mapeamos SEMPRE valueEntries para items
        items: valueEntries.map(entry => ({
          product_id: entry.productId,
          product_name: entry.productName || (informItems ? 'Item' : 'Valor'),
          quantity: informItems ? (entry.quantity || 1) : 1,
          unit_price: parseFloat(entry.grossValue) || 0,
          tax_rate: parseFloat(entry.taxRate) || 0,
          commission_rate: parseFloat(entry.commissionRate) || 0
        })),
      }

      // Aprendizado Silencioso (V3): Atualiza defaults baseados no uso real
      // Fazemos isso em background (não aguardamos resposta se possível ou fazemos antes do refresh)
      for (const entry of valueEntries) {
        const comm = parseFloat(entry.commissionRate) || 0
        const tax = parseFloat(entry.taxRate) || 0

        if (entry.productId) {
          updateProduct(entry.productId, {
            default_commission_rate: comm,
            default_tax_rate: tax,
          })
        } else if (supplierId) {
          updatePersonalSupplierWithRules(supplierId, {
            default_commission_rate: comm,
            default_tax_rate: tax,
          })
        }
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
      quantity: 1,
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

  function handleUpdateValueEntry(id: string, field: keyof Omit<ValueEntry, 'id'>, value: string | number) {
    setValueEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        const updatedEntry = { ...entry, [field]: value }
        
        // Se mudou valor ou produto, recalculamos taxas baseadas em regras
        if (field === 'grossValue' || field === 'productId') {
          const valStr = typeof value === 'string' ? value : String(value)
          const newComm = getEffectiveRate(id, 'commission', field === 'grossValue' ? valStr : undefined, field === 'productId' ? valStr : undefined)
          const newTax = getEffectiveRate(id, 'tax', field === 'grossValue' ? valStr : undefined, field === 'productId' ? valStr : undefined)
          
          updatedEntry.commissionRate = String(newComm)
          updatedEntry.taxRate = String(newTax)
        }
        
        return updatedEntry
      }
      return entry
    }))
  }

  function handleCancel() {
    router.push('/minhasvendas')
  }

  function handleSupplierChange(value: string) {
    setSupplierId(value)
    // Ao mudar fornecedor, limpamos os produtos vinculados mas mantemos os valores
    setValueEntries(prev => prev.map(entry => ({
      ...entry,
      productId: undefined,
      productName: undefined
    })))
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
          <CardContent>
            <div className="space-y-2 mt-[10px] mb-[20px]">
              <Label htmlFor="supplier" className="text-muted-foreground text-[10px] font-bold">Fornecedor (pasta) *</Label>
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

            <div className="space-y-2 mt-[40px] mb-[20px]">
              <Label className="text-muted-foreground text-[10px] font-bold">Cliente *</Label>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Informe os valores da venda</CardTitle>
            <div className="flex items-center space-x-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
              <Label htmlFor="inform-items-switch" className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground cursor-pointer">
                Detalhado
              </Label>
              <Switch 
                id="inform-items-switch"
                checked={informItems} 
                onCheckedChange={setInformItems}
                className="scale-75 data-[state=checked]:bg-primary"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
                
                {/* Corpo: Inputs Centralizados */}
                <div className="flex flex-col items-center gap-4 py-2">
                    
                        {/* Cabeçalho de Tabela - Negrito e Próximo */}
                        <div className={cn(
                            "gap-4 w-full pr-8 mb-0.5", 
                            isIntermediate || !informItems ? "hidden" : "hidden md:grid",
                            informItems && !isIntermediate && "max-w-none grid-cols-[1.5fr_100px_1.2fr_0.8fr_1.2fr]",
                            !informItems && "max-w-2xl mx-auto md:grid-cols-[1.5fr_0.8fr_1.2fr]"
                        )}>
                            {informItems && (
                                <>
                            <Label className="text-[10px] text-foreground font-black text-left pl-1">Item</Label>
                            <Label className="text-[10px] text-foreground font-black text-center">Qntd.</Label>
                        </>
                    )}
                    <Label className="text-[10px] text-foreground font-black text-left pl-1">
                        {informItems ? "Preço" : "Valor"}
                    </Label>
                    <Label className="text-[10px] text-foreground font-black text-center">Impostos</Label>
                    <Label className="text-[10px] text-foreground font-black text-center">Comissão</Label>
                        </div>

                        <div 
                            ref={containerRef}
                            className={cn(
                                "hidden md:flex flex-col gap-3 w-full",
                                informItems ? "max-w-none" : "max-w-2xl"
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
                                    <div className={cn(
                                        "flex justify-center py-1 pb-6 pt-2 relative group border-b border-border animate-in fade-in slide-in-from-top-2 duration-500 delay-150 fill-mode-both data-[removing=true]:animate-out data-[removing=true]:fade-out data-[removing=true]:slide-out-to-top-1 data-[removing=true]:duration-200",
                                        index === valueEntries.length - 1 && "border-b-0 pb-2"
                                    )}
                                         data-removing={removingIds.has(entry.id)}
                                    >
                                        <div className={cn(
                                            "flex flex-wrap items-end gap-x-4 gap-y-4 relative w-full pr-8",
                                            "md:grid md:flex-none",
                                            informItems 
                                                ? isIntermediate
                                                    ? "md:grid-cols-6" // 6 colunas para permitir quebras 4+2 e 2+2+2
                                                    : "md:grid-cols-[1.5fr_100px_1.2fr_0.8fr_1.2fr]" 
                                                : "md:max-w-2xl md:mx-auto md:grid-cols-[1.5fr_0.8fr_1.2fr]"
                                        )}>
                                            {/* Group 1: Item + Qntd (Apenas se informItems) */}
                                            {informItems && (
                                                <>
                                                    {/* Item Selector */}
                                                    <div className={cn(
                                                        "flex flex-col gap-2 min-w-0",
                                                        isIntermediate ? "col-span-4" : ""
                                                    )}>
                                                        <Label className={cn(
                                                            "text-[10px] text-muted-foreground font-bold",
                                                            isIntermediate ? "block pl-1" : "text-center md:hidden"
                                                        )}>Item</Label>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className={cn(
                                                                "h-11 w-full border-2 transition-all rounded-xl justify-between px-3 shadow-md bg-white",
                                                                entry.productId ? 'border-border text-foreground' : 'hover:border-primary/50 font-normal text-muted-foreground'
                                                            )}
                                                            onClick={() => {
                                                              if (!supplierId) {
                                                                toast.error('Selecione um fornecedor primeiro')
                                                                return
                                                              }
                                                              setProductSearchOpen({ open: true, entryId: entry.id })
                                                            }}
                                                        >
                                                            <span className="truncate text-sm font-medium">
                                                                {entry.productName || "Selecionar item..."}
                                                            </span>
                                                            <Search className="h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </div>

                                                    {/* Quantidade */}
                                                    <div className={cn(
                                                        "flex flex-col gap-2 shrink-0",
                                                        isIntermediate ? "col-span-2" : ""
                                                    )}>
                                                        <Label className={cn(
                                                            "text-[10px] text-muted-foreground font-bold",
                                                            isIntermediate ? "block text-center" : "text-center md:hidden"
                                                        )}>Qntd.</Label>
                                                        <CompactNumberInput
                                                            value={entry.quantity}
                                                            onChange={(val) => handleUpdateValueEntry(entry.id, 'quantity', val)}
                                                            min={1}
                                                            step={1}
                                                            decimals={0}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {/* Preço / Valor */}
                                            <div className={cn(
                                                "flex flex-col gap-2 min-w-0",
                                                isIntermediate ? "col-span-2" : ""
                                            )}>
                                                <div className={cn(
                                                    "flex items-center gap-1.5 whitespace-nowrap overflow-hidden",
                                                    isIntermediate ? "justify-start pl-1" : "justify-center"
                                                )}>
                                                    <Label htmlFor={`gross_value_${entry.id}`} className={cn(
                                                        "text-[10px] text-muted-foreground font-bold shrink-0",
                                                        isIntermediate ? "block" : "md:hidden"
                                                    )}>
                                                        {informItems ? "Preço" : "Valor"}
                                                    </Label>
                                                    {informItems && entry.quantity > 1 && (
                                                        <span className="text-[10px] text-muted-foreground/50 font-medium animate-in fade-in slide-in-from-left-1 duration-300 truncate">
                                                            ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.quantity * (parseFloat(entry.grossValue) || 0))})
                                                        </span>
                                                    )}
                                                </div>
                                                <CurrencyInput
                                                    id={`gross_value_${entry.id}`}
                                                    placeholder="0,00"
                                                    value={entry.grossValue}
                                                    onChange={(val) => handleUpdateValueEntry(entry.id, 'grossValue', val)}
                                                />
                                            </div>

                                            {/* Impostos */}
                                            <div className={cn(
                                                "flex flex-col gap-2 min-w-0",
                                                isIntermediate ? "col-span-2" : ""
                                            )}>
                                                <Label className={cn(
                                                    "text-[10px] text-muted-foreground font-bold",
                                                    isIntermediate ? "block text-center" : "text-center md:hidden"
                                                )}>Impostos</Label>
                                                <CompactNumberInput
                                                    value={entry.taxRate ? parseFloat(entry.taxRate) : 0}
                                                    onChange={(val) => handleUpdateValueEntry(entry.id, 'taxRate', String(val))}
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
                                            <div className={cn(
                                                "flex flex-col gap-2 min-w-0",
                                                isIntermediate ? "col-span-2" : ""
                                            )}>
                                                <Label className={cn(
                                                    "text-[10px] text-muted-foreground font-bold",
                                                    isIntermediate ? "block text-center" : "text-center md:hidden"
                                                )}>Comissão</Label>
                                                <div className="flex items-center gap-2">
                                                    <CompactNumberInput
                                                        value={entry.commissionRate ? parseFloat(entry.commissionRate) : 0}
                                                        onChange={(val) => handleUpdateValueEntry(entry.id, 'commissionRate', String(val))}
                                                        min={0}
                                                        max={100}
                                                        step={0.5}
                                                        decimals={2}
                                                        suffix="%"
                                                        accentColor="#67C23A"
                                                        className="w-full"
                                                    />
                                                    
                                                    {index === 0 && selectedSupplier && selectedSupplier.commission_rules.length > 0 && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 border-dashed border-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all rounded-xl">
                                                                    <Wand2 className="h-5 w-5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-56">
                                                                <DropdownMenuLabel>Regras de Faixa</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                {selectedSupplier.commission_rules.filter(r => r.type === 'tiered').map(rule => (
                                                                    <DropdownMenuItem key={rule.id} onClick={() => applyRule(rule.id)} className="flex justify-between items-center cursor-pointer">
                                                                        <span>{rule.name}</span>
                                                                        <span className="font-bold text-muted-foreground">
                                                                            {calculateTieredRate(rule, parseFloat(entry.grossValue) || 0)}%
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

                    {/* V3: Mobile View (Cards) - Apenas se Tela < 768px (sm) */}
                    <div className="md:hidden flex flex-col gap-4 w-full">
                        {valueEntries.filter(e => e.productName || (parseFloat(e.grossValue) > 0)).map((entry, index) => {
                            const entryTotal = (entry.quantity || 1) * (parseFloat(entry.grossValue) || 0)
                            return (
                                <div 
                                    key={entry.id}
                                    onClick={() => {
                                        setEditingEntryId(entry.id)
                                        setIsDrawerOpen(true)
                                    }}
                                    className="bg-white border-2 border-border/60 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden group hover:border-primary/30"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col gap-1 flex-1 min-w-0 mr-4">
                                            <span className="text-xs font-black tracking-tighter text-muted-foreground/60">
                                                {informItems ? `ITEM #${index + 1}` : `ENTRADA #${index + 1}`}
                                            </span>
                                            <h3 className="font-bold text-base text-foreground truncate leading-tight">
                                                {informItems ? (entry.productName || "Selecionar produto...") : "Lançamento Manual"}
                                            </h3>
                                        </div>
                                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-black">
                                            {entry.commissionRate || '0'}%
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex justify-between items-end mt-4 pt-3 border-t border-dashed border-border/50">
                                        <div className="flex flex-col">
                                            {informItems && (
                                                <span className="text-[11px] font-medium text-muted-foreground">
                                                    {entry.quantity} un x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(entry.grossValue) || 0)}
                                                </span>
                                            )}
                                            {!informItems && (
                                                <span className="text-[11px] font-medium text-muted-foreground">
                                                    Taxa: {entry.taxRate}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-lg font-black text-foreground">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entryTotal)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Pencil Indicator (discreto) */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Pencil className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    
                                    {/* Botão Remover Discreto em Mobile */}
                                    {valueEntries.length > 1 && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleRemoveValueEntry(entry.id)
                                            }}
                                            className="absolute -top-1 -right-1 p-2 text-destructive/30 hover:text-destructive transition-colors"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            )
                        })}



                        <Button
                            type="button"
                            variant="outline"
                            className={cn(
                                "h-16 border-dashed border-2 border-primary/30 text-primary hover:bg-primary/5 rounded-2xl font-bold flex gap-2 transition-all",
                                !valueEntries.some(e => e.productName || parseFloat(e.grossValue) > 0) ? "h-24 text-lg border-primary/50 bg-primary/[0.02]" : "mb-8"
                            )}
                            onClick={() => {
                                // Criamos um item limpo para o Drawer
                                const newId = Math.random().toString(36).substr(2, 9)
                                const newEntry: ValueEntry = {
                                    id: newId,
                                    quantity: 1,
                                    grossValue: '',
                                    taxRate: selectedSupplier ? String(selectedSupplier.default_tax_rate || 0) : '0',
                                    commissionRate: selectedSupplier ? String(selectedSupplier.default_commission_rate || 0) : '0',
                                    productName: ''
                                }
                                setValueEntries(prev => [...prev.filter(e => e.productName || parseFloat(e.grossValue) > 0), newEntry])
                                setEditingEntryId(newId)
                                setIsDrawerOpen(true)
                            }}
                        >
                            <Plus className="h-5 w-5" />
                            {valueEntries.some(e => e.productName || parseFloat(e.grossValue) > 0) ? 'ADICIONAR OUTRO' : 'ADICIONAR ITEM'}
                        </Button>
                    </div>

                    {/* Botão Adicionar Valor - ORIGINAL Desktop - Escondido no Mobile */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hidden md:flex border-dashed border-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-300"
                        onClick={handleAddValueEntry}
                    >
                        + Adicionar valor
                    </Button>
                </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 pt-6">
              {/* Linha Separadora com Ícone de Conexão */}
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center">
                  <div className="bg-card px-3">
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
                      valueEntries.reduce((sum, entry) => sum + ((informItems ? (entry.quantity || 1) : 1) * (parseFloat(entry.grossValue) || 0)), 0)
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
                        const qty = informItems ? (entry.quantity || 1) : 1
                        const gross = parseFloat(entry.grossValue) || 0
                        const taxRate = parseFloat(entry.taxRate) || 0
                        const commRate = parseFloat(entry.commissionRate) || 0
                        const base = qty * gross * (1 - (taxRate / 100))
                        return sum + (base * (commRate / 100))
                      }, 0)
                    )}
                  </span>
                </div>
              </div>

            </CardFooter>
        </Card>

        {/* Bloco 3: Financeiro (Pagamento) */}
        <Card>
          <CardHeader>
            <CardTitle>Condições de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-muted-foreground text-[10px] font-bold">Data da Venda</Label>
                <Input
                    id="date"
                    type="date"
                    value={saleDate}
                    onChange={(e) => handleSaleDateChange(e.target.value)}
                    className="h-12 shadow-sm border-2 focus-visible:ring-0 focus-visible:border-primary font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="first_installment_date_footer" className="text-muted-foreground text-[10px] font-bold">
                  {paymentType === 'vista' ? 'Data de Recebimento' : 'Data da 1ª Parcela'}
                </Label>
                <Input
                  id="first_installment_date_footer"
                  type="date"
                  className="h-12 shadow-sm border-2 focus-visible:ring-0 focus-visible:border-primary font-medium"
                  value={firstInstallmentDate}
                  onChange={(e) => handleFirstDateChange(e.target.value)}
                />
              </div>
            </div>

             {/* Seletor de Tipo */}
             <div className="flex justify-center py-4">
                <RadioGroup
                value={paymentType}
                onValueChange={(v) => {
                  const newType = v as 'vista' | 'parcelado'
                  setPaymentType(newType)
                  
                  if (newType === 'parcelado') {
                    // Se os dias estiverem <= 0 (provavelmente vindo de à vista), usa o padrão de 30
                    let days = getSafeNumber(firstInstallmentDays, 30)
                    if (days <= 0) days = 30
                    
                    setFirstInstallmentDays(days)
                    setFirstInstallmentDate(calculateDateFromDays(days, saleDate))
                  } else {
                    // Quando volta para vista, reseta para a data da venda (hoje)
                    setFirstInstallmentDate(saleDate)
                    setFirstInstallmentDays(0)
                  }
                }}
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

            <div 
                className={cn(
                    "grid transition-all duration-500 ease-in-out overflow-hidden",
                    paymentType === 'parcelado' ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
            >
                <div className="min-h-0">
                    <div className="max-w-2xl mx-auto space-y-6 pt-6 animate-in fade-in slide-in-from-top-4 duration-500 fill-mode-both">
                        
                        {/* 1. O Comando (Input Rápido com Autocomplete) */}
                        <div className="space-y-3">
                            <Label htmlFor="quick_condition" className="text-sm font-medium text-center block text-primary">
                                Digite os prazos
                            </Label>
                            <div className="relative max-w-md mx-auto">
                                <Input
                                    id="quick_condition"
                                    placeholder="ex: 30/60/90"
                                    value={quickCondition}
                                    onChange={(e) => {
                                      setQuickCondition(e.target.value)
                                      setIsUpdatingFromQuick(true)
                                      setIrregularPatternWarning(null)
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => {
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
                            <div className="text-xs uppercase tracking-widest font-semibold">Detalhes do Prazo</div>
                            <div className="h-px bg-border flex-1"></div>
                        </div>

                        {/* 3. A Mecânica (Box Técnico) */}
                        <div className="bg-muted/40 rounded-xl p-6 border border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase text-muted-foreground font-bold">
                                Número de Parcelas
                                </Label>
                                <NumberStepper
                                  value={Number(installments) || 1}
                                  onChange={(val) => {
                                    setInstallments(val)
                                    setHasChangedSteppers(true)
                                  }}
                                  min={1}
                                  max={24}
                                  step={1}
                                  size="sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase text-muted-foreground font-bold">
                                Intervalo em dias
                                </Label>
                                <NumberStepper
                                  value={Number(interval) || 30}
                                  onChange={(val) => {
                                    setInterval(val)
                                    setHasChangedSteppers(true)
                                  }}
                                  min={1}
                                  step={5}
                                  size="sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase text-muted-foreground font-bold">
                                1ª Parcela em Dias
                                </Label>
                                <NumberStepper
                                  value={Number(firstInstallmentDays) || 30}
                                  onChange={(val) => {
                                    setFirstInstallmentDays(val)
                                    setFirstInstallmentDate(calculateDateFromDays(val, saleDate))
                                    setHasChangedSteppers(true)
                                  }}
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
                </div>
            </div>
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

      <Dialog open={productSearchOpen.open} onOpenChange={(open) => setProductSearchOpen({ open, entryId: productSearchOpen.entryId })}>
        <DialogContent 
          className="max-w-md w-full p-0 gap-0 overflow-hidden rounded-3xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Selecionar Item</DialogTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="pl-9 h-12 border-2 rounded-xl"
              />
            </div>
          </DialogHeader>
          
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              {selectedProducts
                .filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()))
                .map(product => (
                  <button
                    key={product.id}
                    type="button"
                    className="flex flex-col items-start p-4 hover:bg-muted rounded-2xl transition-colors border-2 border-transparent hover:border-primary/20 text-left"
                    onClick={() => {
                      if (!productSearchOpen.entryId) return
                      const eid = productSearchOpen.entryId
                      setValueEntries(prev => prev.map(entry => {
                        if (entry.id === eid) {
                          return {
                            ...entry,
                            productId: product.id,
                            productName: product.name,
                            grossValue: product.unit_price?.toString() || entry.grossValue,
                          }
                        }
                        return entry
                      }))
                      setProductSearchOpen({ open: false })
                      toast.success(`Item ${product.name} selecionado`)
                    }}
                  >
                    <span className="font-bold text-foreground">{product.name}</span>
                    <div className="flex gap-4 mt-1">
                      {product.unit_price && <span className="text-xs text-muted-foreground">Preço: R$ {product.unit_price.toFixed(2).replace('.', ',')}</span>}
                    </div>
                  </button>
                ))}
              
              {selectedProducts.filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase())).length === 0 && (
                <div className="py-12 text-center text-muted-foreground italic">
                  Nenhum item encontrado para este fornecedor.
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="p-6 bg-muted/20 border-t">
            <Button variant="outline" onClick={() => setProductSearchOpen({ open: false })} className="w-full rounded-xl h-12 font-bold border-2">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        commissionPercentage={null}
      />

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="bottom" className="h-[90vh] sm:h-auto rounded-t-[20px] p-0 flex flex-col overflow-hidden">
          <SheetHeader className="p-6 pb-2 border-b">
            <SheetTitle className="text-xl font-bold">
              {editingEntryId ? 'Editar Item' : 'Adicionar Item'}
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
            {editingEntryId && valueEntries.find(e => e.id === editingEntryId) && (
              <div className="space-y-6">
                {informItems && (
                  <div className="space-y-3">
                    <Label className="text-[10px] text-muted-foreground font-black">Item</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-14 w-full border-2 transition-all rounded-2xl justify-between px-4 shadow-sm bg-white text-base",
                        valueEntries.find(e => e.id === editingEntryId)?.productId ? 'border-border' : 'border-dashed border-primary/30 text-muted-foreground'
                      )}
                      onClick={() => setProductSearchOpen({ open: true, entryId: editingEntryId })}
                    >
                      <span className="truncate font-semibold">
                        {valueEntries.find(e => e.id === editingEntryId)?.productName || "Selecionar item..."}
                      </span>
                      <Search className="h-5 w-5 shrink-0 opacity-50" />
                    </Button>
                  </div>
                )}

                {/* Qntd e Preço em 2 colunas ou Preço Único */}
                <div className={cn("grid gap-4", informItems ? "grid-cols-2" : "grid-cols-1")}>
                  {informItems && (
                    <div className="space-y-3">
                      <Label className="text-[10px] text-muted-foreground font-black">Quantidade</Label>
                      <CompactNumberInput
                        value={valueEntries.find(e => e.id === editingEntryId)?.quantity || 1}
                        onChange={(val) => handleUpdateValueEntry(editingEntryId, 'quantity', val)}
                        min={1}
                        step={1}
                        decimals={0}
                        className="h-14 text-lg font-bold"
                      />
                    </div>
                  )}
                  <div className="space-y-3">
                    <Label className="text-[10px] text-muted-foreground font-black">
                      {informItems ? "Preço Unitário" : "Valor Total"}
                    </Label>
                    <CurrencyInput
                      placeholder="0,00"
                      value={valueEntries.find(e => e.id === editingEntryId)?.grossValue || ''}
                      onChange={(val) => handleUpdateValueEntry(editingEntryId, 'grossValue', val)}
                      className="h-14 text-lg font-bold"
                    />
                  </div>
                </div>
                
                {/* Info Totalizador no Drawer (Apenas se Detalhado) */}
                {informItems && (
                  <div className="bg-muted/30 rounded-2xl p-4 flex justify-between items-center border border-dashed mt-4">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Subtotal do Item</span>
                    <span className="text-xl font-black text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        (valueEntries.find(e => e.id === editingEntryId)?.quantity || 0) * 
                        (parseFloat(valueEntries.find(e => e.id === editingEntryId)?.grossValue || '0') || 0)
                      )}
                    </span>
                  </div>
                )}

                {/* Impostos e Comissão */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-3">
                    <Label className="text-[10px] text-muted-foreground font-black flex items-center gap-2">
                      Impostos <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 text-[9px] px-1 py-0 h-4">Retido</Badge>
                    </Label>
                    <CompactNumberInput
                      value={parseFloat(valueEntries.find(e => e.id === editingEntryId)?.taxRate || '0')}
                      onChange={(val) => handleUpdateValueEntry(editingEntryId, 'taxRate', String(val))}
                      min={0} max={100} step={0.5} decimals={2} suffix="%"
                      accentColor="#f59e0b"
                      className="h-14 text-lg font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] text-muted-foreground font-black flex items-center gap-2">
                      Comissão <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-[9px] px-1 py-0 h-4">Minimo</Badge>
                    </Label>
                    <CompactNumberInput
                      value={parseFloat(valueEntries.find(e => e.id === editingEntryId)?.commissionRate || '0')}
                      onChange={(val) => handleUpdateValueEntry(editingEntryId, 'commissionRate', String(val))}
                      min={0} max={100} step={0.5} decimals={2} suffix="%"
                      accentColor="#67C23A"
                      className="h-14 text-lg font-bold"
                    />
                  </div>
                </div>

              </div>
            )}
          </div>

          <SheetFooterUI className="p-6 border-t bg-background sticky bottom-0 mt-autos">
            <Button onClick={() => setIsDrawerOpen(false)} className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg">
              Confirmar Alteração
            </Button>
          </SheetFooterUI>
        </SheetContent>
      </Sheet>


    </>
  )
}
