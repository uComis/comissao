'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { InstallmentsSheet } from './installments-sheet'
import { ClientDialog } from '@/components/clients'
import { SupplierDialog } from '@/components/suppliers'
import { createPersonalSale, updatePersonalSale } from '@/app/actions/personal-sales'
import { updateProduct } from '@/app/actions/products'
import { updatePersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import { toast } from 'sonner'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import type { Product, PersonalClient, CommissionRule } from '@/types'
import type { PersonalSaleWithItems } from '@/types/personal-sale'
import {
  IdentificationSection,
  ValuesSection,
  PaymentConditionSection,
  NotesSection,
  ProductSearchDialog,
  MobileItemDrawer,
  type ValueEntry,
} from './form-sections'

type Props = {
  suppliers: PersonalSupplierWithRules[]
  productsBySupplier: Record<string, Product[]>
  sale?: PersonalSaleWithItems
  mode?: 'create' | 'edit'
}

function parsePaymentCondition(condition: string | null): {
  type: 'vista' | 'parcelado'
  installments: number
  interval: number
} {
  if (!condition || condition.trim() === '') {
    return { type: 'vista', installments: 3, interval: 30 }
  }

  const parts = condition
    .split('/')
    .map((p) => parseInt(p.trim()))
    .filter((n) => !isNaN(n))
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

function detectIrregularPattern(parts: number[]): { isIrregular: boolean; intervals: number[] } {
    if (parts.length < 3) return { isIrregular: false, intervals: [] }

    const intervals: number[] = []
    for (let i = 1; i < parts.length; i++) {
      intervals.push(parts[i] - parts[i - 1])
    }

    const firstInterval = intervals[0]
    const isIrregular = intervals.some((int) => int !== firstInterval)

    return { isIrregular, intervals }
  }

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

const calculateDaysFromDate = (targetDateStr: string, baseDateStr: string) => {
  const target = new Date(targetDateStr + 'T12:00:00')
  const base = new Date(baseDateStr + 'T12:00:00')
  const diffTime = Math.abs(target.getTime() - base.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function PersonalSaleForm({ suppliers: initialSuppliers, productsBySupplier, sale, mode = 'create' }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [informItems, setInformItems] = useState(false)
  const isEdit = mode === 'edit' && !!sale

  // Mobile Drawer State
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [suppliersList, setSuppliersList] = useState(initialSuppliers)

  const initialPayment = parsePaymentCondition(sale?.payment_condition ?? null)

  const [supplierId, setSupplierId] = useState(sale?.supplier_id || '')
  const [clientId, setClientId] = useState<string | null>(sale?.client_id || null)
  const [clientName, setClientName] = useState(sale?.client_name || '')
  const today = new Date().toISOString().split('T')[0]
  const [saleDate, setSaleDate] = useState(sale?.sale_date || today)
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(
    sale?.first_installment_date || (initialPayment.type === 'vista' ? sale?.sale_date || today : '')
  )

  const [paymentType, setPaymentType] = useState<'vista' | 'parcelado'>(initialPayment.type)
  const [installments, setInstallments] = useState<string | number>(initialPayment.installments)
  const [interval, setInterval] = useState<string | number>(initialPayment.interval)
  const [firstInstallmentDays, setFirstInstallmentDays] = useState<string | number>(30)

  const [quickCondition, setQuickCondition] = useState('')
  const [isUpdatingFromQuick, setIsUpdatingFromQuick] = useState(false)
  const [hasChangedSteppers, setHasChangedSteppers] = useState(false)
  const [irregularPatternWarning, setIrregularPatternWarning] = useState<string | null>(null)

  const [notes, setNotes] = useState(sale?.notes || '')
  const [valueEntries, setValueEntries] = useState<ValueEntry[]>(() => {
    if (sale?.items && sale.items.length > 0) {
      return sale.items.map((item) => ({
        id: item.id,
        quantity: item.quantity || 1,
        grossValue: item.unit_price.toString(),
        taxRate: (item.tax_rate || 0).toString(),
        commissionRate: (item.commission_rate || 0).toString(),
        productId: item.product_id,
        productName: item.product_name,
      }))
    }
    return [
      {
        id: crypto.randomUUID(),
        quantity: 1,
        grossValue: sale?.gross_value?.toString() || '',
        taxRate: sale?.tax_rate?.toString() || '',
        commissionRate: sale?.commission_rate?.toString() || '',
      },
    ]
  })

  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [productSearchOpen, setProductSearchOpen] = useState<{ open: boolean; entryId?: string }>({
    open: false,
  })

  const paymentCondition =
    paymentType === 'vista'
      ? ''
      : Array.from({ length: getSafeNumber(installments, 1) }, (_, i) => {
          const firstDays = getSafeNumber(firstInstallmentDays, 30)
          const gap = getSafeNumber(interval, 30)
          return firstDays + i * gap
        }).join('/')

  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [clientInitialName, setClientInitialName] = useState('')
  const [clientRefreshTrigger, setClientRefreshTrigger] = useState(0)
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const [supplierInitialName, setSupplierInitialName] = useState('')
  const [installmentsSheetOpen, setInstallmentsSheetOpen] = useState(false)

  const selectedProducts = supplierId ? productsBySupplier[supplierId] || [] : []

  const totalValue = useMemo(() => {
    return valueEntries.reduce((sum, entry) => {
      const quantity = informItems ? entry.quantity || 1 : 1
      const gross = parseFloat(entry.grossValue) || 0
      const taxRate = parseFloat(entry.taxRate) || 0
      return sum + quantity * gross * (1 - taxRate / 100)
    }, 0)
  }, [valueEntries, informItems])

  const selectedSupplier = useMemo(() => {
    return suppliersList.find((s) => s.id === supplierId)
  }, [suppliersList, supplierId])

  const calculateTieredRate = (rule: CommissionRule, value: number) => {
    if (!rule.tiers || rule.tiers.length === 0) return rule.percentage || 0

    const tier = rule.tiers.find((t) => {
      const minMatches = value >= t.min
      const maxMatches = t.max === null || value <= t.max
      return minMatches && maxMatches
    })

    return tier ? tier.percentage : rule.tiers[rule.tiers.length - 1].percentage || 0
  }

  const getEffectiveRate = (
    entryId: string,
    target: 'commission' | 'tax',
    currentGross?: string,
    currentProductId?: string | null
  ) => {
    const entry = valueEntries.find((e) => e.id === entryId)
    if (!entry) return 0

    const gross = parseFloat(currentGross !== undefined ? currentGross : entry.grossValue) || 0
    const productId = currentProductId !== undefined ? currentProductId : entry.productId

    // 1. Produto
    if (productId) {
      const product = selectedProducts.find((p) => p.id === productId)
      if (product) {
        if (product.commission_rule_id) {
          const rule = selectedSupplier?.commission_rules.find((r) => r.id === product.commission_rule_id)
          if (rule && rule.target === target && rule.type === 'tiered') {
            return calculateTieredRate(rule, gross)
          }
        }
        const fixed = target === 'commission' ? product.default_commission_rate : product.default_tax_rate
        if (fixed !== null) return fixed
      }
    }

    // 2. Pasta (Fornecedor)
    if (selectedSupplier) {
      const supplierRule = selectedSupplier.commission_rules.find((r) => r.target === target && r.type === 'tiered' && r.is_default)
      if (supplierRule) {
        return calculateTieredRate(supplierRule, gross)
      }

      const fixed = target === 'commission' ? selectedSupplier.default_commission_rate : selectedSupplier.default_tax_rate
      return fixed || 0
    }

    return 0
  }

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
        items: valueEntries.map((entry) => ({
          product_id: entry.productId,
          product_name: entry.productName || (informItems ? 'Item' : 'Valor'),
          quantity: informItems ? entry.quantity || 1 : 1,
          unit_price: parseFloat(entry.grossValue) || 0,
          tax_rate: parseFloat(entry.taxRate) || 0,
          commission_rate: parseFloat(entry.commissionRate) || 0,
        })),
      }

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

      const result = isEdit ? await updatePersonalSale(sale.id, payload) : await createPersonalSale(payload)

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
    setValueEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        quantity: 1,
        grossValue: '',
        taxRate: '',
        commissionRate: '',
      },
    ])
  }

  function handleRemoveValueEntry(id: string) {
    setSwipedItemId(null)
    setRemovingIds((prev) => new Set(prev).add(id))

    setTimeout(() => {
      setValueEntries((prev) => prev.filter((entry) => entry.id !== id))
      setRemovingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 300)
  }

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = (entryId: string) => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance

    if (isLeftSwipe) {
      setSwipedItemId(entryId)
    } else {
      setSwipedItemId(null)
    }
  }

  function handleUpdateValueEntry(id: string, field: keyof Omit<ValueEntry, 'id'>, value: string | number) {
    setValueEntries((prev) =>
      prev.map((entry) => {
        if (entry.id === id) {
          const updatedEntry = { ...entry, [field]: value }

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
      })
    )
  }

  function handleCancel() {
    router.push('/minhasvendas')
  }

  function handleSupplierChange(value: string) {
    setSupplierId(value)
    setValueEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        productId: undefined,
        productName: undefined,
      }))
    )
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
    setTimeout(() => {
      setSupplierId(supplier.id)
    }, 0)
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
      setFirstInstallmentDate(date)
    }
  }

  const handleQuickConditionBlur = () => {
    setIsUpdatingFromQuick(true)

    const normalized = quickCondition.replace(/[\s,-]+/g, '/')

    if (normalized.includes('...')) {
      setIsUpdatingFromQuick(false)
      return
    }

    const parts = normalized
      .split('/')
      .map((p) => parseInt(p.trim()))
      .filter((n) => !isNaN(n))

    if (parts.length > 0) {
      const first = parts[0]
      const count = parts.length

      const { isIrregular, intervals } = detectIrregularPattern(parts)

      if (isIrregular && parts.length >= 3) {
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
      return
    }
    setQuickCondition(value)
    setIrregularPatternWarning(null)

    setTimeout(() => {
      const parts = value
        .split('/')
        .map((p) => parseInt(p.trim()))
        .filter((n) => !isNaN(n))
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
          parts.push(safeFirstDays + i * safeInterval)
        }
        setQuickCondition(`${parts.join('/')}/... (${safeInstallments}x)`)
      } else {
        const parts = []
        for (let i = 0; i < safeInstallments; i++) {
          parts.push(safeFirstDays + i * safeInterval)
        }
        setQuickCondition(parts.join('/'))
      }
    }
  }, [installments, interval, firstInstallmentDays, paymentType, isUpdatingFromQuick, sale, hasChangedSteppers, quickCondition])

  const handlePaymentTypeChange = (newType: 'vista' | 'parcelado') => {
                  setPaymentType(newType)

                  if (newType === 'parcelado') {
                    let days = getSafeNumber(firstInstallmentDays, 30)
                    if (days <= 0) days = 30

                    setFirstInstallmentDays(days)
                    setFirstInstallmentDate(calculateDateFromDays(days, saleDate))
                  } else {
                    setFirstInstallmentDate(saleDate)
                    setFirstInstallmentDays(0)
                  }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mx-auto max-w-7xl">
        {/* Mobile: Stack everything vertically */}
        <div className="lg:hidden space-y-6">
          <IdentificationSection
            suppliers={suppliersList}
            supplierId={supplierId}
            clientId={clientId}
            clientRefreshTrigger={clientRefreshTrigger}
            onSupplierChange={handleSupplierChange}
            onClientChange={handleClientChange}
            onSupplierAddClick={(name) => {
              setSupplierInitialName(name || '')
              setSupplierDialogOpen(true)
            }}
            onClientAddClick={(name) => {
              setClientInitialName(name || '')
              setClientDialogOpen(true)
            }}
          />

          <ValuesSection
            informItems={informItems}
            supplierId={supplierId}
            valueEntries={valueEntries}
            removingIds={removingIds}
            swipedItemId={swipedItemId}
            selectedSupplier={selectedSupplier}
            onInformItemsChange={setInformItems}
            onAddValueEntry={handleAddValueEntry}
            onRemoveValueEntry={handleRemoveValueEntry}
            onUpdateValueEntry={handleUpdateValueEntry}
            onProductSearchClick={(entryId) => setProductSearchOpen({ open: true, entryId })}
            onSwipedItemIdChange={setSwipedItemId}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onEditingEntryClick={(entryId) => {
              setEditingEntryId(entryId)
              setIsDrawerOpen(true)
            }}
            calculateTieredRate={calculateTieredRate}
          />

          <PaymentConditionSection
            saleDate={saleDate}
            firstInstallmentDate={firstInstallmentDate}
            paymentType={paymentType}
            installments={installments}
            interval={interval}
            firstInstallmentDays={firstInstallmentDays}
            quickCondition={quickCondition}
            irregularPatternWarning={irregularPatternWarning}
            totalValue={totalValue}
            onSaleDateChange={handleSaleDateChange}
            onFirstInstallmentDateChange={handleFirstDateChange}
            onPaymentTypeChange={handlePaymentTypeChange}
            onInstallmentsChange={(val) => {
                          setInstallments(val)
                          setHasChangedSteppers(true)
                        }}
            onIntervalChange={(val) => {
                          setInterval(val)
                          setHasChangedSteppers(true)
                        }}
            onFirstInstallmentDaysChange={(val) => {
                          setFirstInstallmentDays(val)
                          setFirstInstallmentDate(calculateDateFromDays(val, saleDate))
                          setHasChangedSteppers(true)
                        }}
            onQuickConditionChange={(value) => {
              setQuickCondition(value)
              setIsUpdatingFromQuick(true)
              setIrregularPatternWarning(null)
            }}
            onQuickConditionBlur={handleQuickConditionBlur}
            onSelectSuggestion={handleSelectSuggestion}
            onDismissWarning={() => setIrregularPatternWarning(null)}
            onViewAllInstallments={() => setInstallmentsSheetOpen(true)}
          />

          <NotesSection notes={notes} onNotesChange={setNotes} />

          <div className="flex justify-end gap-4 pb-10">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} size="lg">
              {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Salvar Venda'}
                                  </Button>
                                </div>
                      </div>

        {/* Desktop: 2-column layout */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_400px] lg:gap-6">
          {/* Left Column: Values + Payment */}
          <div className="space-y-6">
            <ValuesSection
              informItems={informItems}
              supplierId={supplierId}
              valueEntries={valueEntries}
              removingIds={removingIds}
              swipedItemId={swipedItemId}
              selectedSupplier={selectedSupplier}
              onInformItemsChange={setInformItems}
              onAddValueEntry={handleAddValueEntry}
              onRemoveValueEntry={handleRemoveValueEntry}
              onUpdateValueEntry={handleUpdateValueEntry}
              onProductSearchClick={(entryId) => setProductSearchOpen({ open: true, entryId })}
              onSwipedItemIdChange={setSwipedItemId}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onEditingEntryClick={(entryId) => {
                setEditingEntryId(entryId)
                setIsDrawerOpen(true)
              }}
              calculateTieredRate={calculateTieredRate}
            />

            <PaymentConditionSection
              saleDate={saleDate}
              firstInstallmentDate={firstInstallmentDate}
              paymentType={paymentType}
              installments={installments}
              interval={interval}
              firstInstallmentDays={firstInstallmentDays}
              quickCondition={quickCondition}
              irregularPatternWarning={irregularPatternWarning}
              totalValue={totalValue}
              onSaleDateChange={handleSaleDateChange}
              onFirstInstallmentDateChange={handleFirstDateChange}
              onPaymentTypeChange={handlePaymentTypeChange}
              onInstallmentsChange={(val) => {
                setInstallments(val)
                setHasChangedSteppers(true)
              }}
              onIntervalChange={(val) => {
                setInterval(val)
                setHasChangedSteppers(true)
              }}
              onFirstInstallmentDaysChange={(val) => {
                setFirstInstallmentDays(val)
                setFirstInstallmentDate(calculateDateFromDays(val, saleDate))
                setHasChangedSteppers(true)
              }}
              onQuickConditionChange={(value) => {
                setQuickCondition(value)
                setIsUpdatingFromQuick(true)
                setIrregularPatternWarning(null)
              }}
              onQuickConditionBlur={handleQuickConditionBlur}
              onSelectSuggestion={handleSelectSuggestion}
              onDismissWarning={() => setIrregularPatternWarning(null)}
              onViewAllInstallments={() => setInstallmentsSheetOpen(true)}
            />

        <div className="flex justify-end gap-4 pb-10">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving} size="lg">
            {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Salvar Venda'}
          </Button>
        </div>
          </div>

          {/* Right Sidebar: Identification + Notes */}
          <div className="space-y-6">
            <IdentificationSection
              suppliers={suppliersList}
              supplierId={supplierId}
              clientId={clientId}
              clientRefreshTrigger={clientRefreshTrigger}
              onSupplierChange={handleSupplierChange}
              onClientChange={handleClientChange}
              onSupplierAddClick={(name) => {
                setSupplierInitialName(name || '')
                setSupplierDialogOpen(true)
              }}
              onClientAddClick={(name) => {
                setClientInitialName(name || '')
                setClientDialogOpen(true)
              }}
            />

            <NotesSection notes={notes} onNotesChange={setNotes} />
            </div>
        </div>
      </form>

      <ProductSearchDialog
        open={productSearchOpen.open}
        products={selectedProducts}
        onOpenChange={(open) => setProductSearchOpen({ open, entryId: productSearchOpen.entryId })}
        onProductSelect={(product) => {
                      if (!productSearchOpen.entryId) return
                      const eid = productSearchOpen.entryId
                      setValueEntries((prev) =>
                        prev.map((entry) => {
                          if (entry.id === eid) {
                            return {
                              ...entry,
                              productId: product.id,
                              productName: product.name,
                              grossValue: product.unit_price?.toString() || entry.grossValue,
                            }
                          }
                          return entry
                        })
                      )
                      setProductSearchOpen({ open: false })
                      toast.success(`Item ${product.name} selecionado`)
                    }}
      />

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

      <MobileItemDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        entry={valueEntries.find((e) => e.id === editingEntryId) || null}
        informItems={informItems}
        supplierId={supplierId}
        onProductSearchClick={() => {
          if (editingEntryId) {
            setProductSearchOpen({ open: true, entryId: editingEntryId })
          }
        }}
        onUpdateEntry={handleUpdateValueEntry}
        onDeleteEntry={(id) => {
          handleRemoveValueEntry(id)
                    setIsDrawerOpen(false)
                  }}
      />
    </>
  )
}
