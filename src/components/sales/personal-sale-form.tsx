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
import { createPersonalSale } from '@/app/actions/personal-sales'
import { toast } from 'sonner'
import type { PersonalSupplierWithRule } from '@/app/actions/personal-suppliers'
import type { Product, PersonalClient } from '@/types'
import type { CreatePersonalSaleItemInput } from '@/types/personal-sale'

type SaleItem = CreatePersonalSaleItemInput & { id: string }

type Props = {
  suppliers: PersonalSupplierWithRule[]
  productsBySupplier: Record<string, Product[]>
}

export function PersonalSaleForm({ suppliers, productsBySupplier }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Form state
  const [supplierId, setSupplierId] = useState('')
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentType, setPaymentType] = useState<'vista' | 'parcelado'>('vista')
  const [installments, setInstallments] = useState(3)
  const [interval, setInterval] = useState(30)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<SaleItem[]>([])

  // Calcula a condição de pagamento baseado nos inputs
  const paymentCondition = paymentType === 'vista'
    ? ''
    : Array.from({ length: installments }, (_, i) => (i + 1) * interval).join('/')

  // Client dialog state
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [clientRefreshTrigger, setClientRefreshTrigger] = useState(0)

  // Installments sheet state
  const [installmentsSheetOpen, setInstallmentsSheetOpen] = useState(false)

  const selectedProducts = supplierId ? (productsBySupplier[supplierId] || []) : []

  // Calcula valor total dos itens
  const totalValue = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  }, [items])

  // Obtém regra de comissão do fornecedor selecionado
  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === supplierId)
  }, [suppliers, supplierId])

  const commissionPercentage = useMemo(() => {
    const rule = selectedSupplier?.commission_rule
    if (!rule) return null
    if (rule.type === 'fixed') return rule.percentage
    // Para escalonada, pega a primeira faixa como referência
    if (rule.type === 'tiered' && rule.tiers && rule.tiers.length > 0) {
      return rule.tiers[0].percentage
    }
    return null
  }, [selectedSupplier])

  // Calcula datas da primeira e última parcela
  const installmentDates = useMemo(() => {
    if (paymentType !== 'parcelado') return null
    const baseDate = new Date(saleDate + 'T12:00:00')
    const firstDate = new Date(baseDate)
    firstDate.setDate(firstDate.getDate() + interval)
    const lastDate = new Date(baseDate)
    lastDate.setDate(lastDate.getDate() + installments * interval)
    return {
      first: new Intl.DateTimeFormat('pt-BR').format(firstDate),
      last: new Intl.DateTimeFormat('pt-BR').format(lastDate),
    }
  }, [paymentType, saleDate, installments, interval])

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

    if (items.length === 0) {
      toast.error('Adicione pelo menos um item')
      return
    }

    const invalidItems = items.filter(item => !item.product_name.trim())
    if (invalidItems.length > 0) {
      toast.error('Todos os itens precisam ter nome')
      return
    }

    setSaving(true)

    try {
      const result = await createPersonalSale({
        supplier_id: supplierId,
        client_id: clientId,
        client_name: clientName,
        sale_date: saleDate,
        payment_condition: paymentCondition.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map(({ product_id, product_name, quantity, unit_price }) => ({
          product_id,
          product_name,
          quantity,
          unit_price,
        })),
      })

      if (result.success) {
        toast.success('Venda cadastrada')
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
    setSupplierId(value)
    setItems([])
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
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" asChild>
                    <Link href="/fornecedores/novo">
                      <Plus className="h-4 w-4" />
                    </Link>
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
                  onChange={(e) => setSaleDate(e.target.value)}
                />
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
                          Intervalo (dias)
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

        {/* Itens */}
        <Card>
          <CardHeader>
            <CardTitle>Itens da Venda</CardTitle>
          </CardHeader>
          <CardContent>
            {!supplierId ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Selecione um fornecedor para adicionar itens
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
            {saving ? 'Salvando...' : 'Salvar Venda'}
          </Button>
        </div>
      </form>

      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onSuccess={handleClientCreated}
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
