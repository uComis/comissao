'use client'

import { useState } from 'react'
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
import { Plus } from 'lucide-react'
import { SaleItemsEditor } from './sale-items-editor'
import { ClientCombobox } from '@/components/clients'
import { createPersonalSale } from '@/app/actions/personal-sales'
import { toast } from 'sonner'
import type { PersonalSupplierWithRule } from '@/app/actions/personal-suppliers'
import type { Product } from '@/types'
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
  const [paymentCondition, setPaymentCondition] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<SaleItem[]>([])

  const selectedProducts = supplierId ? (productsBySupplier[supplierId] || []) : []

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

  // Reset items when supplier changes
  function handleSupplierChange(value: string) {
    setSupplierId(value)
    setItems([])
  }

  function handleClientChange(id: string | null, name: string) {
    setClientId(id)
    setClientName(name)
  }

  return (
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
              <ClientCombobox
                value={clientId}
                onChange={handleClientChange}
                placeholder="Pesquisar ou criar cliente..."
                className="w-full"
              />
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

            <div className="space-y-2">
              <Label htmlFor="payment">Condição de Pagamento</Label>
              <Input
                id="payment"
                value={paymentCondition}
                onChange={(e) => setPaymentCondition(e.target.value)}
                placeholder="Ex: 30/60/90"
              />
              <p className="text-xs text-muted-foreground">
                Informe os prazos separados por barra
              </p>
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
  )
}
