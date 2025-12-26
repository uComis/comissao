'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Plus, Eye, Save } from 'lucide-react'
import { SaleItemsEditor } from './sale-items-editor'
import { InstallmentsSheet } from './installments-sheet'
import { ClientCombobox, ClientDialog } from '@/components/clients'
import { SupplierDialog } from '@/components/suppliers'
import { createPersonalSale, updatePersonalSale } from '@/app/actions/personal-sales'
import { addCommissionRule } from '@/app/actions/personal-suppliers' // Import nova action
import { toast } from 'sonner'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers' // Tipo atualizado
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

  // Detectar intervalo (diferença entre parcelas consecutivas)
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

  // Parse condição de pagamento inicial
  const initialPayment = parsePaymentCondition(sale?.payment_condition ?? null)

  // Form state
  const [supplierId, setSupplierId] = useState(sale?.supplier_id || '')
  const [clientId, setClientId] = useState<string | null>(sale?.client_id || null)
  const [clientName, setClientName] = useState(sale?.client_name || '')
  const [saleDate, setSaleDate] = useState(sale?.sale_date || new Date().toISOString().split('T')[0])
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(sale?.first_installment_date || '')
  
  // Função auxiliar para calcular data baseada em dias
  const calculateDateFromDays = (days: number, baseDateStr: string) => {
    const date = new Date(baseDateStr + 'T12:00:00')
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  // Função auxiliar para calcular dias baseados em data
  const calculateDaysFromDate = (targetDateStr: string, baseDateStr: string) => {
    const target = new Date(targetDateStr + 'T12:00:00')
    const base = new Date(baseDateStr + 'T12:00:00')
    const diffTime = Math.abs(target.getTime() - base.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
    return diffDays
  }

  const [paymentType, setPaymentType] = useState<'vista' | 'parcelado'>(initialPayment.type)
  // States agora armazenam string para permitir vazio durante digitação
  const [installments, setInstallments] = useState<string | number>(initialPayment.installments)
  const [interval, setInterval] = useState<string | number>(initialPayment.interval)
  const [firstInstallmentDays, setFirstInstallmentDays] = useState<string | number>(30)

  const [quickCondition, setQuickCondition] = useState('') // Novo campo facilitador
  
  // Flag para evitar loop de atualização quando o update vem do próprio input mágico
  const [isUpdatingFromQuick, setIsUpdatingFromQuick] = useState(false)

  // Função auxiliar para obter valor numérico seguro dos states
  const getSafeNumber = (val: string | number, min: number = 0) => {
    if (val === '' || val === undefined || val === null) return min
    const num = typeof val === 'string' ? parseInt(val) : val
    return isNaN(num) ? min : num
  }
  
  // Inicializa a data da primeira parcela se não estiver definida
  useMemo(() => {
    if (paymentType === 'parcelado' && !firstInstallmentDate) {
      // Usa o valor padrão de 30 dias se não tiver data definida
      const safeInterval = getSafeNumber(interval, 30)
      setFirstInstallmentDate(calculateDateFromDays(safeInterval, saleDate))
      setFirstInstallmentDays(safeInterval)
    } else if (paymentType === 'parcelado' && firstInstallmentDate && saleDate) {
      // Se já tem data, calcula os dias
      const days = calculateDaysFromDate(firstInstallmentDate, saleDate)
      setFirstInstallmentDays(days)
    }
  }, [paymentType, saleDate, firstInstallmentDate]) // Removido 'interval' das dependências

  // Handler para "Dias até 1ª Parcela"
  const handleFirstInstallmentDaysChange = (val: string) => {
    setFirstInstallmentDays(val)
    const days = parseInt(val)
    if (!isNaN(days)) {
      setFirstInstallmentDate(calculateDateFromDays(days, saleDate))
    }
  }

  // Handler para "Data 1ª Parcela"
  const handleFirstDateChange = (date: string) => {
    setFirstInstallmentDate(date)
    if (date && saleDate) {
      const days = calculateDaysFromDate(date, saleDate)
      setFirstInstallmentDays(days)
    }
  }

  // Quando muda a data da venda, recalcula a data da 1ª parcela mantendo a distência em dias
  const handleSaleDateChange = (date: string) => {
    setSaleDate(date)
    if (paymentType === 'parcelado') {
      const days = getSafeNumber(firstInstallmentDays, 30)
      setFirstInstallmentDate(calculateDateFromDays(days, date))
    }
  }

  // Parser de condição rápida (ex: 30/60/90)
  // Agora só roda no Blur para não atrapalhar a digitação
  const handleQuickConditionBlur = () => {
    setIsUpdatingFromQuick(true) // Marca que estamos atualizando via input mágico
    
    // Normaliza separadores para barra
    const normalized = quickCondition.replace(/[\s,-]+/g, '/')
    
    // Tenta fazer o parse apenas se tiver números
    const parts = normalized.split('/').map(p => parseInt(p.trim())).filter(n => !isNaN(n))
    
    if (parts.length > 0) {
      // Reconstrói a string formatada bonitinha
      setQuickCondition(parts.join('/'))

      const first = parts[0]
      const count = parts.length
      
      // Se tiver mais de 1 número, tenta inferir o intervalo
      let detectedInterval = getSafeNumber(interval, 30)

      if (parts.length > 1) {
        detectedInterval = parts[1] - parts[0]
      } else if (parts.length === 1 && first > 0) {
         detectedInterval = 30 
      }

      if (detectedInterval <= 0) detectedInterval = 30 

      // Atualiza os estados
      setInstallments(count)
      setFirstInstallmentDays(first)
      setFirstInstallmentDate(calculateDateFromDays(first, saleDate))
      setInterval(detectedInterval)
    }
    
    // Pequeno delay para liberar a flag, garantindo que o effect de reconstrução não rode
    // imediatamente após este update
    setTimeout(() => setIsUpdatingFromQuick(false), 100)
  }

  // Effect para reconstruir a string mágica quando os campos individuais mudam
  // SÓ RODA se não estivermos digitando no campo mágico
  useMemo(() => {
    if (isUpdatingFromQuick) {
      return
    }

    if (paymentType === 'parcelado') {
      const safeInstallments = getSafeNumber(installments, 1)
      const safeInterval = getSafeNumber(interval, 30)
      const safeFirstDays = getSafeNumber(firstInstallmentDays, 30)

      const parts = []
      for (let i = 0; i < safeInstallments; i++) {
        parts.push(safeFirstDays + (i * safeInterval))
      }
      setQuickCondition(parts.join('/'))
    }
  }, [installments, interval, firstInstallmentDays, paymentType, isUpdatingFromQuick])



  const [notes, setNotes] = useState(sale?.notes || '')
  const [entryMode, setEntryMode] = useState<'total' | 'items'>(
    sale?.items && sale.items.length > 0 ? 'items' : 'total'
  )
  const [grossValueInput, setGrossValueInput] = useState(sale?.gross_value?.toString() || '')
  
  // Commission logic states
  const [selectedRuleId, setSelectedRuleId] = useState<string>('custom')
  const [commissionRate, setCommissionRate] = useState<string>(
    sale?.commission_rate?.toString() || ''
  )
  const [showSaveRuleDialog, setShowSaveRuleDialog] = useState(false)
  const [newRuleName, setNewRuleName] = useState('')
  const [savingRule, setSavingRule] = useState(false)

  const [items, setItems] = useState<SaleItem[]>(() => {
    if (sale?.items && sale.items.length > 0) {
      return sale.items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))
    }
    return []
  })

  // Calcula a condição de pagamento baseado nos inputs
  const paymentCondition = paymentType === 'vista'
    ? ''
    : Array.from({ length: getSafeNumber(installments, 1) }, (_, i) => (i + 1) * getSafeNumber(interval, 30)).join('/')

  // Client dialog state
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [clientRefreshTrigger, setClientRefreshTrigger] = useState(0)

  // Supplier dialog state
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)

  // Installments sheet state
  const [installmentsSheetOpen, setInstallmentsSheetOpen] = useState(false)

  const selectedProducts = supplierId ? (productsBySupplier[supplierId] || []) : []

  // Calcula valor total dos itens ou usa o valor informado
  const totalValue = useMemo(() => {
    if (entryMode === 'total') {
      return parseFloat(grossValueInput) || 0
    }
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  }, [items, entryMode, grossValueInput])

  // Obtém fornecedor selecionado
  const selectedSupplier = useMemo(() => {
    return suppliersList.find((s) => s.id === supplierId)
  }, [suppliersList, supplierId])

  // Quando o fornecedor muda, reseta a regra selecionada para a default
  useMemo(() => {
      if (selectedSupplier && !isEdit) {
          const defaultRule = selectedSupplier.default_rule
          if (defaultRule) {
              setSelectedRuleId(defaultRule.id)
              // Atualiza a taxa visualmente
              if (defaultRule.type === 'fixed' && defaultRule.percentage) {
                  setCommissionRate(defaultRule.percentage.toString())
              } else if (defaultRule.type === 'tiered' && defaultRule.tiers?.[0]) {
                  setCommissionRate(defaultRule.tiers[0].percentage.toString())
              }
          } else {
              setSelectedRuleId('custom')
              setCommissionRate('')
          }
      }
  }, [supplierId, isEdit]) // Depende apenas do ID e modo, não do objeto inteiro para evitar loops

  // Quando a regra selecionada muda
  const handleRuleChange = (ruleId: string) => {
      setSelectedRuleId(ruleId)
      
      if (ruleId === 'custom') {
          // Mantém o valor atual para edição livre ou limpa? Melhor manter.
          return
      }

      const rule = selectedSupplier?.commission_rules.find(r => r.id === ruleId)
      if (rule) {
          if (rule.type === 'fixed' && rule.percentage) {
              setCommissionRate(rule.percentage.toString())
          } else if (rule.type === 'tiered' && rule.tiers?.[0]) {
              // TODO: Lógica de tiers baseada no valor total?
              // Por enquanto pega o primeiro tier como referência
              setCommissionRate(rule.tiers[0].percentage.toString())
          }
      }
  }

  // Quando o valor da comissão é editado manualmente
  const handleCommissionRateChange = (value: string) => {
      setCommissionRate(value)
      // Se mudou o valor e estava numa regra fixa, muda para custom
      // (a menos que o valor coincida, mas simplificamos mudando pra custom sempre que edita na mão)
      if (selectedRuleId !== 'custom') {
          setSelectedRuleId('custom')
      }
  }

  // Salvar nova regra
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
              is_default: false // Nunca cria como default pelo atalho da venda
          })

          if (result.success) {
              toast.success('Regra salva com sucesso!')
              
              // Atualiza a lista local de fornecedores com a nova regra
              setSuppliersList(prev => prev.map(s => {
                  if (s.id === supplierId) {
                      return {
                          ...s,
                          commission_rules: [...s.commission_rules, result.data]
                      }
                  }
                  return s
              }))
              
              // Seleciona a nova regra
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
    // Agora usa o valor do input se existir
    if (commissionRate) return parseFloat(commissionRate)
    return null
  }, [commissionRate])

  // Calcula datas da primeira e última parcela
  const installmentDates = useMemo(() => {
    if (paymentType !== 'parcelado') return null
    // Alterado para permitir visualização mesmo sem data explícita (usando fallback)
    
    const safeInstallments = getSafeNumber(installments, 1)
    const safeInterval = getSafeNumber(interval, 30)

    let firstDate: Date
    if (firstInstallmentDate) {
       firstDate = new Date(firstInstallmentDate + 'T12:00:00')
    } else {
       // Fallback se data estiver vazia durante digitação
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
        commission_rate: commissionRate ? parseFloat(commissionRate) : undefined,
        items: entryMode === 'items' ? items.map(({ product_id, product_name, quantity, unit_price }) => ({
          product_id,
          product_name,
          quantity,
          unit_price,
        })) : [],
      }

      // Garante que interval/installments sejam números válidos no payload se necessário
      // (aqui eles não vão direto pro payload, mas são usados pra calcular payment_condition)

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
    setSupplierId(supplier.id)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Dados da Venda */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Fornecedor *</Label>
                <div className="flex gap-2">
                  <Select value={supplierId} onValueChange={handleSupplierChange}>
                    <SelectTrigger id="supplier" className="flex-1">
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliersList.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => setSupplierDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cliente *</Label>
                <div className="flex gap-2">
                  <ClientCombobox
                    value={clientId}
                    onChange={handleClientChange}
                    placeholder="Selecionar cliente..."
                    className="flex-1"
                    refreshTrigger={clientRefreshTrigger}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setClientDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data da Venda *</Label>
                <Input
                  id="date"
                  type="date"
                  value={saleDate}
                  onChange={(e) => handleSaleDateChange(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label htmlFor="commission_rate">Comissão</Label>
                    
                    {/* Seletor de Regras */}
                    {selectedSupplier && selectedSupplier.commission_rules.length > 0 && (
                        <Select value={selectedRuleId} onValueChange={handleRuleChange}>
                            <SelectTrigger className="h-7 w-[180px] text-xs">
                                <SelectValue placeholder="Regra..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="custom">Personalizado</SelectItem>
                                {selectedSupplier.commission_rules.map(rule => (
                                    <SelectItem key={rule.id} value={rule.id}>
                                        {rule.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="relative">
                  <Input
                    id="commission_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
                    value={commissionRate}
                    onChange={(e) => handleCommissionRateChange(e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
                
                <div className="flex justify-between items-start">
                    <p className="text-[0.8rem] text-muted-foreground">
                    Percentual aplicado sobre o valor bruto.
                    </p>
                    {/* Botão Salvar Nova Regra (só aparece se for Custom e tiver valor) */}
                    {selectedRuleId === 'custom' && commissionRate && parseFloat(commissionRate) > 0 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] text-blue-600 hover:text-blue-700 px-2 -mt-1"
                            onClick={() => setShowSaveRuleDialog(true)}
                        >
                            <Save className="h-3 w-3 mr-1" />
                            Salvar como regra
                        </Button>
                    )}
                </div>
              </div>

              <div className="relative py-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  Condições de Pagamento
                </span>
              </div>

              <div className="space-y-3">
                <RadioGroup
                  value={paymentType}
                  onValueChange={(v) => setPaymentType(v as 'vista' | 'parcelado')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vista" id="vista" />
                    <Label htmlFor="vista" className="font-normal cursor-pointer">
                      À vista
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="parcelado" id="parcelado" />
                    <Label htmlFor="parcelado" className="font-normal cursor-pointer">
                      Parcelado
                    </Label>
                  </div>
                </RadioGroup>

                {paymentType === 'parcelado' && (
                  <div className="space-y-3 pt-2">
                    
                    {/* Novo campo facilitador */}
                    <div className="space-y-1">
                      <Label htmlFor="quick_condition" className="text-xs font-medium text-blue-600">
                        Condição Rápida (ex: 30/60/90)
                      </Label>
                      <Input
                        id="quick_condition"
                        placeholder="Digite os dias..."
                        value={quickCondition}
                        onChange={(e) => {
                          setQuickCondition(e.target.value)
                          setIsUpdatingFromQuick(true) // Pausa updates reversos enquanto digita
                        }}
                        onBlur={handleQuickConditionBlur}
                        className="border-blue-200 focus-visible:ring-blue-500"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Preenche automaticamente parcelas e prazos.
                      </p>
                    </div>

                    <Separator className="my-2" />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="installments" className="text-xs">
                          Parcelas
                        </Label>
                        <Input
                          id="installments"
                          type="number"
                          min={1}
                          value={installments}
                          onChange={(e) => setInstallments(e.target.value)}
                          onBlur={(e) => setInstallments(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="interval" className="text-xs">
                          Intervalo entre parcelas
                        </Label>
                        <Input
                          id="interval"
                          type="number"
                          min={1}
                          value={interval}
                          onChange={(e) => setInterval(e.target.value)}
                          onBlur={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label htmlFor="first_days" className="text-xs">
                          Dias p/ 1ª Parcela
                        </Label>
                        <Input
                          id="first_days"
                          type="number"
                          min={0}
                          value={firstInstallmentDays}
                          onChange={(e) => handleFirstInstallmentDaysChange(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="first_installment_date" className="text-xs">
                          Data da 1ª Parcela
                        </Label>
                        <Input
                          id="first_installment_date"
                          type="date"
                          required
                          value={firstInstallmentDate}
                          onChange={(e) => handleFirstDateChange(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Preview compacto */}
                    <div className="rounded-md border border-border bg-muted/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-sm">
                            {totalValue > 0 ? (
                              <>
                                {installments} parcelas de{' '}
                                <span className="font-medium">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(totalValue / installments)}
                                </span>
                              </>
                            ) : (
                              <>{installments} parcelas</>
                            )}
                          </p>
                          {installmentDates && (
                            <p className="text-xs text-muted-foreground">
                              1ª: {installmentDates.first} → última: {installmentDates.last}
                            </p>
                          )}
                        </div>
                        {totalValue > 0 && (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs shrink-0"
                            onClick={() => setInstallmentsSheetOpen(true)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver detalhes
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações sobre a venda..."
                rows={8}
              />
            </CardContent>
          </Card>
        </div>

        {/* Itens ou Valor Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Detalhes da Venda</CardTitle>
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
                  Valor Total
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
                  Detalhar Itens
                </Label>
              </div>
            </RadioGroup>
          </CardHeader>
          <CardContent>
            {!supplierId ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Selecione um fornecedor para continuar
                </p>
              </div>
            ) : entryMode === 'total' ? (
              <div className="max-w-xs space-y-2 py-4">
                <Label htmlFor="gross_value">Valor Total da Venda *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    id="gross_value"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    className="pl-9"
                    value={grossValueInput}
                    onChange={(e) => setGrossValueInput(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Informe o valor total bruto da venda conforme consta na nota ou pedido.
                </p>
              </div>
            ) : (
              <SaleItemsEditor
                products={selectedProducts}
                value={items}
                onChange={setItems}
              />
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Salvar Venda'}
          </Button>
        </div>
      </form>

      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onSuccess={handleClientCreated}
      />

      <SupplierDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        onSuccess={handleSupplierCreated}
      />

      <InstallmentsSheet
        open={installmentsSheetOpen}
        onOpenChange={setInstallmentsSheetOpen}
        saleDate={saleDate}
        installments={installments}
        interval={interval}
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
