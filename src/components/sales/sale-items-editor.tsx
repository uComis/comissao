'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ComboboxCreatable } from '@/components/ui/combobox-creatable'
import { Plus, Trash2 } from 'lucide-react'
import type { Product } from '@/types'
import type { CreatePersonalSaleItemInput } from '@/types/personal-sale'

type SaleItem = CreatePersonalSaleItemInput & {
  id: string // ID temporário para controle de UI
}

type Props = {
  products: Product[]
  value: SaleItem[]
  onChange: (items: SaleItem[]) => void
}

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function SaleItemsEditor({ products, value, onChange }: Props) {
  const [items, setItems] = useState<SaleItem[]>(value)

  useEffect(() => {
    setItems(value)
  }, [value])

  const productOptions = products.map((p) => ({
    value: p.id,
    label: p.name,
  }))

  function addItem() {
    const newItem: SaleItem = {
      id: generateTempId(),
      product_id: null,
      product_name: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 0,
    }
    const updated = [...items, newItem]
    setItems(updated)
    onChange(updated)
  }

  function removeItem(id: string) {
    const updated = items.filter(item => item.id !== id)
    setItems(updated)
    onChange(updated)
  }

  function handleProductChange(itemId: string, productId: string, productName: string) {
    const updated = items.map(item => {
      if (item.id !== itemId) return item

      // Se selecionou um produto existente
      if (productId) {
        const product = products.find(p => p.id === productId)
        if (product) {
          return {
            ...item,
            product_id: productId,
            product_name: product.name,
            unit_price: product.unit_price || 0,
          }
        }
      }

      // Digitou manualmente (creatable)
      return {
        ...item,
        product_id: null,
        product_name: productName,
      }
    })
    setItems(updated)
    onChange(updated)
  }

  function updateItem(id: string, field: keyof CreatePersonalSaleItemInput, value: unknown) {
    const updated = items.map(item => {
      if (item.id !== id) return item
      return { ...item, [field]: value }
    })
    setItems(updated)
    onChange(updated)
  }

  const total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[250px]">Produto</TableHead>
              <TableHead className="w-[100px]">Qtd</TableHead>
              <TableHead className="w-[150px]">Preço Unit.</TableHead>
              <TableHead className="w-[100px]">Impostos (%)</TableHead>
              <TableHead className="w-[150px] text-right">Total Líq.</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <ComboboxCreatable
                    options={productOptions}
                    value={item.product_id || item.product_name}
                    onChange={(productId, productName) => 
                      handleProductChange(item.id, productId, productName)
                    }
                    placeholder="Pesquisar ou digitar..."
                    searchPlaceholder="Pesquisar produto..."
                    emptyMessage="Nenhum produto encontrado"
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={item.quantity}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '')
                      updateItem(item.id, 'quantity', val === '' ? '' : parseInt(val))
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value)
                      if (isNaN(val) || val < 1) {
                        updateItem(item.id, 'quantity', 1)
                      }
                    }}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={item.unit_price}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                      updateItem(item.id, 'unit_price', val === '' ? '' : parseFloat(val) || 0)
                    }}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value.replace(',', '.'))
                      if (isNaN(val) || val < 0) {
                        updateItem(item.id, 'unit_price', 0)
                      }
                    }}
                    className="w-32"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={item.tax_rate ?? 0}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                      updateItem(item.id, 'tax_rate', val === '' ? '' : parseFloat(val) || 0)
                    }}
                    className="w-20"
                  />
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency((item.quantity * item.unit_price) * (1 - ((item.tax_rate || 0) / 100)))}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Nenhum item adicionado</p>
                  <Button type="button" variant="outline" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={addItem}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>

        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Líquido</p>
          <p className="text-2xl font-bold">
            {formatCurrency(items.reduce((sum, item) => {
              const gross = item.quantity * item.unit_price
              const tax = gross * ((item.tax_rate || 0) / 100)
              return sum + (gross - tax)
            }, 0))}
          </p>
        </div>
      </div>
    </div>
  )
}
