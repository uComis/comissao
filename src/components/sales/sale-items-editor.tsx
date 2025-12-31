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
import { Label } from '@/components/ui/label'
import { ComboboxCreatable } from '@/components/ui/combobox-creatable'
import { ProductPicker } from '@/components/products/product-picker'
import { ProductDialog } from '@/components/products/product-dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Plus, Trash2, ChevronLeft, Pencil, Check, Link2 } from 'lucide-react'
import { NumberStepper } from '@/components/ui/number-stepper'
import { useIsMobile } from '@/hooks/use-mobile'
import type { Product } from '@/types'
import type { CreatePersonalSaleItemInput } from '@/types/personal-sale'

type SaleItem = CreatePersonalSaleItemInput & {
  id: string
}

type Props = {
  products: Product[]
  value: SaleItem[]
  onChange: (items: SaleItem[]) => void
  supplierId: string
  onProductCreated?: () => void
  defaultCommissionRate?: number
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

export function SaleItemsEditor({ products, value, onChange, supplierId, onProductCreated, defaultCommissionRate = 0 }: Props) {
  const isMobile = useIsMobile()
  const [items, setItems] = useState<SaleItem[]>(value)
  
  // Mobile states
  const [pickerOpen, setPickerOpen] = useState(false)
  const [formSheetOpen, setFormSheetOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SaleItem | null>(null)
  
  // Product Dialog state
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [productDialogInitialName, setProductDialogInitialName] = useState<string | undefined>()
  
  // Valores padrão para "Aplicar a todos"
  const [bulkTaxRate, setBulkTaxRate] = useState<string>('')
  const [bulkCommissionRate, setBulkCommissionRate] = useState<string>('')
  
  // Pega valores do último item para herança
  const getLastItemValues = () => {
    if (items.length === 0) {
      return { tax_rate: 0, commission_rate: defaultCommissionRate }
    }
    const lastItem = items[items.length - 1]
    return {
      tax_rate: lastItem.tax_rate || 0,
      commission_rate: lastItem.commission_rate || defaultCommissionRate
    }
  }

  useEffect(() => {
    setItems(value)
  }, [value])

  const productOptions = products.map((p) => ({
    value: p.id,
    label: p.name,
  }))

  // === Item CRUD ===
  function openAddItem() {
    const inherited = getLastItemValues()
    if (isMobile) {
      // No mobile, abre o picker primeiro
      setEditingItem({
        id: generateTempId(),
        product_id: null,
        product_name: '',
        quantity: 1,
        unit_price: 0,
        tax_rate: inherited.tax_rate,
        commission_rate: inherited.commission_rate,
      })
      setPickerOpen(true)
    } else {
      // No desktop, adiciona linha na tabela
      addItemDesktop()
    }
  }

  function openEditItem(item: SaleItem) {
    setEditingItem({ ...item })
    if (isMobile) {
      setFormSheetOpen(true)
    }
  }

  function saveItem() {
    if (!editingItem) return

    const exists = items.find(i => i.id === editingItem.id)
    let updated: SaleItem[]

    if (exists) {
      updated = items.map(i => i.id === editingItem.id ? editingItem : i)
    } else {
      updated = [...items, editingItem]
    }

    setItems(updated)
    onChange(updated)
    setFormSheetOpen(false)
    setEditingItem(null)
  }

  function removeItem(id: string) {
    const updated = items.filter(item => item.id !== id)
    setItems(updated)
    onChange(updated)
  }

  // === Mobile Product Picker handlers ===
  function handleProductPickerSelect(productId: string | null, productName: string, unitPrice?: number) {
    if (!editingItem) return

    setEditingItem({
      ...editingItem,
      product_id: productId,
      product_name: productName,
      unit_price: unitPrice ?? editingItem.unit_price,
    })
    
    setPickerOpen(false)
    // Abre o sheet com o form após selecionar
    setTimeout(() => setFormSheetOpen(true), 100)
  }

  function handleAddProductClick(initialName?: string) {
    // Mantém o picker aberto por trás, dialog abre por cima
    setProductDialogInitialName(initialName)
    setProductDialogOpen(true)
  }

  function handleProductDialogClose(open: boolean) {
    setProductDialogOpen(open)
    if (!open) {
      setProductDialogInitialName(undefined)
    }
  }

  function handleProductCreatedFromDialog(product: Product) {
    // Seleciona o produto criado automaticamente
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        product_id: product.id,
        product_name: product.name,
        unit_price: product.unit_price ?? editingItem.unit_price,
      })
    }
    
    // Notifica o parent para atualizar a lista de produtos
    onProductCreated?.()
    
    // Sequência de transições com respiro rápido
    setTimeout(() => {
      setPickerOpen(false)
      setTimeout(() => setFormSheetOpen(true), 200)
    }, 150)
  }

  function updateEditingField(field: keyof CreatePersonalSaleItemInput, fieldValue: unknown) {
    if (!editingItem) return
    setEditingItem({ ...editingItem, [field]: fieldValue })
  }

  // === Desktop table handlers ===
  function handleProductChange(itemId: string, productId: string, productName: string) {
    const updated = items.map(item => {
      if (item.id !== itemId) return item

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

      return { ...item, product_id: null, product_name: productName }
    })
    setItems(updated)
    onChange(updated)
  }

  function updateItem(id: string, field: keyof CreatePersonalSaleItemInput, fieldValue: unknown) {
    const updated = items.map(item => {
      if (item.id !== id) return item
      return { ...item, [field]: fieldValue }
    })
    setItems(updated)
    onChange(updated)
  }

  function addItemDesktop() {
    const inherited = getLastItemValues()
    const newItem: SaleItem = {
      id: generateTempId(),
      product_id: null,
      product_name: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: inherited.tax_rate,
      commission_rate: inherited.commission_rate,
    }
    const updated = [...items, newItem]
    setItems(updated)
    onChange(updated)
  }
  
  // Aplicar valores em massa
  function applyBulkValues() {
    const taxVal = bulkTaxRate !== '' ? parseFloat(bulkTaxRate) : null
    const commVal = bulkCommissionRate !== '' ? parseFloat(bulkCommissionRate) : null
    
    if (taxVal === null && commVal === null) return
    
    const updated = items.map(item => ({
      ...item,
      ...(taxVal !== null && { tax_rate: taxVal }),
      ...(commVal !== null && { commission_rate: commVal }),
    }))
    setItems(updated)
    onChange(updated)
  }

  const totalLiquido = items.reduce((sum, item) => {
    const gross = item.quantity * item.unit_price
    const tax = gross * ((item.tax_rate || 0) / 100)
    return sum + (gross - tax)
  }, 0)

  return (
    <div className="space-y-4">
      {/* === DESKTOP: Tabela (md+) === */}
      <div className="hidden md:block">
        {/* Header "Aplicar a todos" */}
        {items.length > 0 && (
          <div className="flex items-center gap-4 mb-3 p-3 bg-muted/30 rounded-lg border border-dashed">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aplicar a todos:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Taxa</span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="—"
                value={bulkTaxRate}
                onChange={(e) => setBulkTaxRate(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                className="w-16 h-8 text-xs text-center"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Comissão</span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="—"
                value={bulkCommissionRate}
                onChange={(e) => setBulkCommissionRate(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                className="w-16 h-8 text-xs text-center"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={applyBulkValues}
              disabled={bulkTaxRate === '' && bulkCommissionRate === ''}
            >
              <Link2 className="h-3 w-3 mr-1" />
              Aplicar
            </Button>
          </div>
        )}
        
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Produto</TableHead>
                <TableHead className="w-[80px]">Qtd</TableHead>
                <TableHead className="w-[120px]">Preço Unit.</TableHead>
                <TableHead className="w-[80px]">Taxa (%)</TableHead>
                <TableHead className="w-[80px]">Comis. (%)</TableHead>
                <TableHead className="w-[120px] text-right">Total Líq.</TableHead>
                <TableHead className="w-[50px]"></TableHead>
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
                      className="w-16"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={item.commission_rate ?? 0}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                        updateItem(item.id, 'commission_rate', val === '' ? '' : parseFloat(val) || 0)
                      }}
                      className="w-16"
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
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Nenhum item adicionado</p>
                    <Button type="button" variant="outline" onClick={addItemDesktop}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
        </Table>

        <div className="flex items-center justify-between mt-4">
          <Button type="button" variant="outline" onClick={addItemDesktop}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>

          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Líquido</p>
            <p className="text-2xl font-bold">{formatCurrency(totalLiquido)}</p>
          </div>
        </div>
      </div>

      {/* === MOBILE: Cards (<md) === */}
      <div className="md:hidden space-y-3">
        {/* Lista de cards */}
        {items.length === 0 ? (
          <div className="text-center py-8 border rounded-lg border-dashed">
            <p className="text-muted-foreground mb-4">Nenhum item adicionado</p>
            <Button type="button" variant="outline" onClick={openAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </div>
        ) : (
          <>
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-card"
              >
                {/* Info principal */}
                <div className="flex-1 min-w-0" onClick={() => openEditItem(item)}>
                  <p className="font-medium truncate">
                    {item.product_name || 'Produto não selecionado'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{item.quantity}x</span>
                    <span>•</span>
                    <span>{formatCurrency(item.unit_price)}</span>
                    {(item.tax_rate ?? 0) > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-orange-500">-{item.tax_rate}%</span>
                      </>
                    )}
                    {(item.commission_rate ?? 0) > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600">{item.commission_rate}%</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Subtotal */}
                <div className="text-right shrink-0">
                  <p className="font-bold">
                    {formatCurrency((item.quantity * item.unit_price) * (1 - ((item.tax_rate || 0) / 100)))}
                  </p>
                </div>

                {/* Ações */}
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditItem(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Total mobile */}
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-sm text-muted-foreground">Total Líquido</span>
              <span className="text-xl font-bold">{formatCurrency(totalLiquido)}</span>
            </div>
          </>
        )}

        {/* Botão para adicionar */}
        {items.length > 0 && (
          <Button
            type="button"
            onClick={openAddItem}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        )}
      </div>

      {/* === MOBILE: Product Picker (fullscreen) === */}
      {isMobile && (
        <ProductPicker
          products={products}
          value={editingItem?.product_id || null}
          onChange={handleProductPickerSelect}
          onAddClick={handleAddProductClick}
          placeholder="Selecionar produto..."
          className="hidden" // O botão fica escondido, controlamos via estado
        />
      )}

      {/* Sheet de picker customizado para mobile */}
      {isMobile && (
        <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
          <SheetContent 
            side="right" 
            className="w-full sm:max-w-full h-full flex flex-col p-0"
          >
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle>Selecionar Produto</SheetTitle>
            </SheetHeader>

            {/* Search Input */}
            <MobileProductSearch
              products={products}
              onSelect={handleProductPickerSelect}
              onAddClick={handleAddProductClick}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* === MOBILE: Form Sheet === */}
      <Sheet open={formSheetOpen} onOpenChange={setFormSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Detalhes do Item</SheetTitle>
            <SheetDescription>
              {editingItem?.product_name || 'Configure quantidade e valores'}
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 py-4 space-y-6">
            {/* Produto selecionado */}
            <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Produto</p>
                <p className="font-medium">{editingItem?.product_name || '-'}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFormSheetOpen(false)
                  setTimeout(() => setPickerOpen(true), 100)
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Trocar
              </Button>
            </div>

            {/* Campos do form */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <NumberStepper
                  value={editingItem?.quantity || 1}
                  onChange={(val) => updateEditingField('quantity', val)}
                  min={1}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-price">Preço Unitário</Label>
                <Input
                  id="mobile-price"
                  type="text"
                  inputMode="decimal"
                  value={editingItem?.unit_price || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                    updateEditingField('unit_price', val === '' ? '' : parseFloat(val) || 0)
                  }}
                  className="text-lg h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Impostos (%)</Label>
                <NumberStepper
                  value={editingItem?.tax_rate ?? 0}
                  onChange={(val) => updateEditingField('tax_rate', val)}
                  min={0}
                  max={100}
                  step={0.5}
                  suffix="%"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Comissão (%)</Label>
                <NumberStepper
                  value={editingItem?.commission_rate ?? 0}
                  onChange={(val) => updateEditingField('commission_rate', val)}
                  min={0}
                  max={100}
                  step={0.5}
                  suffix="%"
                />
              </div>
            </div>

            {/* Preview do total */}
            {editingItem && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Líquido do Item</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(
                    (editingItem.quantity * editingItem.unit_price) * 
                    (1 - ((editingItem.tax_rate || 0) / 100))
                  )}
                </p>
              </div>
            )}
          </div>

          <SheetFooter className="border-t p-4">
            <Button 
              type="button" 
              onClick={saveItem} 
              className="w-full h-12 text-base"
              disabled={!editingItem?.product_name}
            >
              <Check className="h-4 w-4 mr-2" />
              {items.find(i => i.id === editingItem?.id) ? 'Salvar Alterações' : 'Adicionar Item'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* === Product Dialog (criar novo produto) === */}
      <ProductDialog
        open={productDialogOpen}
        onOpenChange={handleProductDialogClose}
        supplierId={supplierId}
        initialName={productDialogInitialName}
        showSku={false}
        onProductCreated={handleProductCreatedFromDialog}
      />
    </div>
  )
}

// === Componente auxiliar para busca de produtos mobile ===
function MobileProductSearch({
  products,
  onSelect,
  onAddClick,
}: {
  products: Product[]
  onSelect: (productId: string | null, productName: string, unitPrice?: number) => void
  onAddClick: (initialName?: string) => void
}) {
  const [search, setSearch] = useState('')

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {/* Search Input */}
      <div className="px-4 py-3 border-b">
        <div className="relative">
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12"
            autoFocus
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {/* Quando não encontra nada na busca */}
        {search && filteredProducts.length === 0 ? (
          <div className="flex flex-col">
            {/* Usar nome digitado */}
            <button
              type="button"
              onClick={() => onSelect(null, search.trim())}
              className="w-full px-4 py-4 text-left flex items-center gap-3 hover:bg-muted transition-colors border-b"
            >
              <Check className="h-5 w-5 text-primary opacity-0" />
              <span>Usar &quot;{search}&quot;</span>
            </button>
            
            {/* Cadastrar produto */}
            <button
              type="button"
              onClick={() => onAddClick(search.trim())}
              className="w-full px-4 py-4 text-left flex items-center gap-3 hover:bg-muted transition-colors text-primary font-medium"
            >
              <Plus className="h-5 w-5" />
              <span>Cadastrar &quot;{search}&quot;</span>
            </button>
          </div>
        ) : (
          <>
            {/* Novo Produto - sempre visível no topo */}
            <button
              type="button"
              onClick={() => onAddClick()}
              className="w-full px-4 py-4 text-left flex items-center gap-3 hover:bg-muted transition-colors border-b text-primary"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Novo Produto</span>
            </button>

            {/* Lista de produtos */}
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onSelect(product.id, product.name, product.unit_price ?? undefined)}
                className="w-full px-4 py-4 text-left flex items-center gap-3 hover:bg-muted transition-colors border-b"
              >
                <Check className="h-5 w-5 text-primary opacity-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium truncate">{product.name}</span>
                  {product.sku && (
                    <span className="text-xs text-muted-foreground">
                      SKU: {product.sku}
                    </span>
                  )}
                </div>
                {product.unit_price != null && (
                  <span className="text-sm text-muted-foreground shrink-0">
                    {formatCurrency(product.unit_price)}
                  </span>
                )}
              </button>
            ))}
          </>
        )}

        {filteredProducts.length === 0 && !search && (
          <div className="px-4 py-8 text-center text-muted-foreground">
            Nenhum produto cadastrado
          </div>
        )}
      </div>
    </>
  )
}

