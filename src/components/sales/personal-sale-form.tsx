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
import { Plus, Eye } from 'lucide-react'
import { SaleItemsEditor } from './sale-items-editor'
import { InstallmentsSheet } from './installments-sheet'
import { ClientCombobox, ClientDialog } from '@/components/clients'
import { SupplierDialog } from '@/components/suppliers'
import { createPersonalSale, updatePersonalSale } from '@/app/actions/personal-sales'
import { toast } from 'sonner'
import type { PersonalSupplierWithRule } from '@/app/actions/personal-suppliers'
import type { Product, PersonalClient } from '@/types'
import type { CreatePersonalSaleItemInput, PersonalSaleWithItems } from '@/types/personal-sale'

type SaleItem = CreatePersonalSaleItemInput & { id: string }

type Props = {
  suppliers: PersonalSupplierWithRule[]
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
  const [installments, setInstallments] = useState(initialPayment.installments)
  const [interval, setInterval] = useState(initialPayment.interval) // Esse é o prazo entre parcelas (ex: 30)
  
  // State auxiliar para "Dias até a 1ª parcela"
  const [firstInstallmentDays, setFirstInstallmentDays] = useState<number>(30)
  
  // Inicializa a data da primeira parcela se não estiver definida
  useMemo(() => {
    if (paymentType === 'parcelado' && !firstInstallmentDate) {
      // Usa o valor padrão de 30 dias se não tiver data definida
      setFirstInstallmentDate(calculateDateFromDays(30, saleDate))
      setFirstInstallmentDays(30)
    } else if (paymentType === 'parcelado' && firstInstallmentDate && saleDate) {
      // Se já tem data, calcula os dias
      const days = calculateDaysFromDate(firstInstallmentDate, saleDate)
      setFirstInstallmentDays(days)
    }
  }, [paymentType, saleDate, firstInstallmentDate]) // Removido 'interval' das dependências

  // Handler para "Dias até 1ª Parcela"
  const handleFirstInstallmentDaysChange = (days: number) => {
    const newDays = Math.max(0, days)
    setFirstInstallmentDays(newDays)
    setFirstInstallmentDate(calculateDateFromDays(newDays, saleDate))
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
      setFirstInstallmentDate(calculateDateFromDays(firstInstallmentDays, date))
    }
  }

  const [notes, setNotes] = useState(sale?.notes || '')
  const [entryMode, setEntryMode] = useState<'total' | 'items'>(
    sale?.items && sale.items.length > 0 ? 'items' : 'total'
  )
  const [grossValueInput, setGrossValueInput] = useState(sale?.gross_value?.toString() || '')
  
  // Commission rate state
  const [commissionRate, setCommissionRate] = useState<string>(
    sale?.commission_rate?.toString() || ''
  )

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
    : Array.from({ length: installments }, (_, i) => (i + 1) * interval).join('/')

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

  // Obtém regra de comissão do fornecedor selecionado
  const selectedSupplier = useMemo(() => {
    return suppliersList.find((s) => s.id === supplierId)
  }, [suppliersList, supplierId])

  // Efeito para atualizar a comissão quando o fornecedor muda
  // Mas APENAS se não for uma edição (sale existe) ou se o campo estiver vazio
  useMemo(() => {
    if (isEdit && sale?.commission_rate) return // Não sobrecreve na edição se já existe

    const rule = selectedSupplier?.commission_rule
    if (!rule) {
      if (!isEdit) setCommissionRate('') // Limpa se não tiver regra e não for edição
      return
    }

    let rate = ''
    if (rule.type === 'fixed' && rule.percentage) {
      rate = rule.percentage.toString()
    } else if (rule.type === 'tiered' && rule.tiers && rule.tiers.length > 0) {
      // Para escalonada, pega a primeira faixa como sugestão inicial
      rate = rule.tiers[0].percentage.toString()
    }

    // Só atualiza se achou uma taxa
    if (rate) {
      setCommissionRate(rate)
    }
  }, [selectedSupplier, isEdit, sale])

  const commissionPercentage = useMemo(() => {
    // Agora usa o valor do input se existir, senão tenta calcular (fallback)
    if (commissionRate) return parseFloat(commissionRate)
    
    const rule = selectedSupplier?.commission_rule
    if (!rule) return null
    if (rule.type === 'fixed') return rule.percentage
    // Para escalonada, pega a primeira faixa como referência
    if (rule.type === 'tiered' && rule.tiers && rule.tiers.length > 0) {
      return rule.tiers[0].percentage
    }
    return null
  }, [selectedSupplier, commissionRate])

  // Calcula datas da primeira e última parcela
  const installmentDates = useMemo(() => {
    if (paymentType !== 'parcelado' || !firstInstallmentDate) return null
    
    const firstDate = new Date(firstInstallmentDate + 'T12:00:00')
    const lastDate = new Date(firstDate)
    
    // A primeira parcela é "firstDate", então sobram (installments - 1) parcelas para frente
    // Assumindo que as demais parcelas seguem o mesmo intervalo (30 dias padrão entre elas ou o intervalo calculado)
    // O intervalo entre parcelas subsequentes geralmente é fixo (ex: 30 dias), mesmo que o primeiro seja diferente (ex: 45)
    // Se o usuário mudou o "prazo" para 45 dias, isso é o prazo DA PRIMEIRA. As outras costumam ser a cada 30.
    // MAS, no seu modelo atual, "interval" é usado para tudo.
    // Vou manter a lógica onde 'interval' é o espaçamento entre todas. 
    // Se quiser que a primeira seja 45 e as outras 30, precisaríamos de dois campos: "Prazo 1ª" e "Intervalo Demais".
    // Por enquanto, vou assumir que o intervalo calculado se aplica a todas.
    
    lastDate.setDate(lastDate.getDate() + ((installments - 1) * interval))
    
    return {
      first: new Intl.DateTimeFormat('pt-BR').format(firstDate),
      last: new Intl.DateTimeFormat('pt-BR').format(lastDate),
    }
  }, [paymentType, installments, interval, firstInstallmentDate])

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

  function handleSupplierCreated(supplier: PersonalSupplierWithRule) {
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

              <div className="space-y-2">
                <Label htmlFor="commission_rate">Comissão (%)</Label>
                <div className="relative">
                  <Input
                    id="commission_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  Percentual aplicado sobre o valor bruto.
                </p>
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
                          onChange={(e) => setInstallments(Math.max(1, parseInt(e.target.value) || 1))}
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
                          onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
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
                          onChange={(e) => handleFirstInstallmentDaysChange(parseInt(e.target.value) || 0)}
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
    </>
  )
}
