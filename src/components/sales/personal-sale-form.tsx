'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { InstallmentsSheet } from './installments-sheet'
import { ClientDialog } from '@/components/clients'
import { ProductDialog } from '@/components/products'
import { createPersonalSale, updatePersonalSale } from '@/app/actions/personal-sales'
import { updateProduct } from '@/app/actions/products'
import { updatePersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import { toast } from 'sonner'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import type { Product, PersonalClient, CommissionRule } from '@/types'
import type { PersonalSaleWithItems } from '@/types/personal-sale'
import { usePreferences } from '@/hooks/use-preferences'
import {
  IdentificationSection,
  ValuesSection,
  PaymentConditionSection,
  NotesSection,
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

function detectDescendingOrder(parts: number[]): number | null {
    for (let i = 1; i < parts.length; i++) {
      if (parts[i] <= parts[i - 1]) return i
    }
    return null
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
  const { preferences, setPreference } = usePreferences()
  const [saving, setSaving] = useState(false)
  const [informItems, setInformItems] = useState(preferences.saleInformItems)
  const isEdit = mode === 'edit' && !!sale

  // Mobile Drawer State
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [suppliersList, setSuppliersList] = useState(initialSuppliers)

  const initialPayment = parsePaymentCondition(sale?.payment_condition ?? null)

  const [supplierId, setSupplierId] = useState(sale?.supplier_id || preferences.defaultSupplierId || '')
  const [clientId, setClientId] = useState<string | null>(sale?.client_id || null)
  const [clientName, setClientName] = useState(sale?.client_name || '')
  const today = new Date().toISOString().split('T')[0]
  const [saleDate, setSaleDate] = useState(sale?.sale_date || today)
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(
    sale?.first_installment_date || (initialPayment.type === 'vista' ? sale?.sale_date || today : '')
  )

  const [installments, setInstallments] = useState<string | number>(
    initialPayment.type === 'vista' ? 1 : initialPayment.installments
  )
  const [interval, setInterval] = useState<string | number>(initialPayment.interval)
  const [firstInstallmentDays, setFirstInstallmentDays] = useState<string | number>(
    initialPayment.type === 'vista' ? 0 : 30
  )

  const [quickCondition, setQuickCondition] = useState('')
  const [isUpdatingFromQuick, setIsUpdatingFromQuick] = useState(false)
  const [hasChangedSteppers, setHasChangedSteppers] = useState(false)
  const [irregularPatternWarning, setIrregularPatternWarning] = useState<string | null>(null)
  const [customDaysList, setCustomDaysList] = useState<number[] | null>(null)
  const [detectedPattern, setDetectedPattern] = useState<{ interval: number; count: number } | null>(null)

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
    // Use a stable ID for the initial entry to avoid hydration mismatch
    return [
      {
        id: 'initial-entry',
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
  const [editProductDialogProduct, setEditProductDialogProduct] = useState<Product | null>(null)

  const isVista = getSafeNumber(installments, 1) === 1
  const paymentCondition = isVista
    ? String(getSafeNumber(firstInstallmentDays, 0))
    : Array.from({ length: getSafeNumber(installments, 1) }, (_, i) => {
        const firstDays = getSafeNumber(firstInstallmentDays, 30)
        const gap = getSafeNumber(interval, 30)
        return firstDays + i * gap
      }).join('/')

  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [clientInitialName, setClientInitialName] = useState('')
  const [clientRefreshTrigger, setClientRefreshTrigger] = useState(0)
  const [installmentsSheetOpen, setInstallmentsSheetOpen] = useState(false)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [productRefreshTrigger, setProductRefreshTrigger] = useState(0)

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
    const newId = crypto.randomUUID()

    // Determine default tax/commission rates
    let defaultTaxRate = ''
    let defaultCommissionRate = ''

    // 1. If supplier has rules via getEffectiveRate, use those
    if (selectedSupplier) {
      const supplierTax = selectedSupplier.default_tax_rate || 0
      const supplierComm = selectedSupplier.default_commission_rate || 0
      // Check for tiered default rules too
      const tieredTax = selectedSupplier.commission_rules.find((r) => r.target === 'tax' && r.type === 'tiered' && r.is_default)
      const tieredComm = selectedSupplier.commission_rules.find((r) => r.target === 'commission' && r.type === 'tiered' && r.is_default)

      if (tieredTax || supplierTax) defaultTaxRate = String(tieredTax ? 0 : supplierTax)
      if (tieredComm || supplierComm) defaultCommissionRate = String(tieredComm ? 0 : supplierComm)
    }

    // 2. Fallback: copy from last entry with grossValue > 0
    if (!defaultTaxRate && !defaultCommissionRate) {
      const lastWithValue = [...valueEntries].reverse().find((e) => parseFloat(e.grossValue) > 0)
      if (lastWithValue) {
        defaultTaxRate = lastWithValue.taxRate
        defaultCommissionRate = lastWithValue.commissionRate
      }
    }

    setValueEntries((prev) => [
      ...prev,
      {
        id: newId,
        quantity: 1,
        grossValue: '',
        taxRate: defaultTaxRate,
        commissionRate: defaultCommissionRate,
      },
    ])
    return newId
  }

  function handleAddValueEntryAndEdit() {
    const newId = handleAddValueEntry()
    // Wait for state update, then open drawer
    setTimeout(() => {
      setEditingEntryId(newId)
      setIsDrawerOpen(true)
    }, 0)
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

            // Only override if there's an actual rule; preserve manually-set / pre-filled values otherwise
            if (newComm || field === 'productId') updatedEntry.commissionRate = String(newComm)
            if (newTax || field === 'productId') updatedEntry.taxRate = String(newTax)
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

    // Auto-set as default if user only has one supplier
    if (suppliersList.length === 1 && !preferences.defaultSupplierId) {
      setPreference('defaultSupplierId', value)
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
    setSuppliersList((prev) => {
      const exists = prev.some((s) => s.id === supplier.id)
      if (exists) {
        return prev.map((s) => (s.id === supplier.id ? supplier : s))
      }
      return [...prev, supplier]
    })
    setTimeout(() => {
      setSupplierId(supplier.id)
    }, 0)
  }

  function handleProductCreated(product: Product) {
    // Auto-select the newly created product in the current entry
    if (productSearchOpen.entryId) {
      const entryId = productSearchOpen.entryId
      setValueEntries((prev) =>
        prev.map((entry) => {
          if (entry.id === entryId) {
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
      toast.success(`Item ${product.name} criado e selecionado`)
    }
    
    // Trigger refresh of products list
    setProductRefreshTrigger((prev) => prev + 1)
    router.refresh()
  }

  function handleAddNewProduct() {
    if (!supplierId) {
      toast.error('Selecione um fornecedor primeiro')
      return
    }
    setProductDialogOpen(true)
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
    const days = getSafeNumber(firstInstallmentDays, isVista ? 0 : 30)
    setFirstInstallmentDate(calculateDateFromDays(days, date))
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

      const badIndex = detectDescendingOrder(parts)
      if (badIndex !== null) {
        setIrregularPatternWarning(
          `A ${badIndex + 1}ª parcela (${parts[badIndex]} dias) deve ser maior que a ${badIndex}ª (${parts[badIndex - 1]} dias).`
        )
        return
      }

      setIrregularPatternWarning(null)

      let detectedInterval = getSafeNumber(interval, 30)

      if (parts.length > 1) {
        detectedInterval = parts[1] - parts[0]
      } else if (parts.length === 1 && first > 0) {
        detectedInterval = 30
      }

      if (detectedInterval <= 0) detectedInterval = 30

      // Detect pattern from 2nd installment onwards (intervals between consecutive parts from index 1+)
      if (parts.length >= 2) {
        const intervalsFrom2nd: number[] = []
        for (let i = 1; i < parts.length; i++) {
          intervalsFrom2nd.push(parts[i] - parts[i - 1])
        }
        // Pattern detected if all intervals from 2nd onward are equal
        // For 2 parts, we have 1 interval — that's a pattern
        const patternInterval = intervalsFrom2nd.length >= 1 ? intervalsFrom2nd[intervalsFrom2nd.length - 1] : null
        const hasPattern = patternInterval !== null && patternInterval > 0 &&
          (intervalsFrom2nd.length <= 1 || intervalsFrom2nd.slice(1).every(i => i === intervalsFrom2nd[1]))

        setDetectedPattern(hasPattern ? { interval: patternInterval, count } : null)
      } else {
        setDetectedPattern(null)
      }

      // Check if intervals are irregular — store explicit days list
      const isRegular = parts.length <= 2 || parts.every((_, i) => i === 0 || parts[i] - parts[i - 1] === detectedInterval)
      setCustomDaysList(isRegular ? null : parts)

      setInstallments(count)
      setFirstInstallmentDays(first)
      setFirstInstallmentDate(calculateDateFromDays(first, saleDate))
      setInterval(detectedInterval)

      setQuickCondition(parts.join('/'))
    }

    setTimeout(() => setIsUpdatingFromQuick(false), 100)
  }

  const handlePatternAdd = () => {
    if (!detectedPattern) return
    const parts = quickCondition.split('/').map(p => parseInt(p.trim())).filter(n => !isNaN(n))
    if (parts.length === 0) return
    const lastValue = parts[parts.length - 1]
    const newValue = lastValue + detectedPattern.interval
    const newParts = [...parts, newValue]
    setQuickCondition(newParts.join('/'))
    // Trigger blur logic inline
    setIsUpdatingFromQuick(true)
    setCustomDaysList(newParts.length <= 2 || newParts.every((_, i) => i === 0 || newParts[i] - newParts[i - 1] === (newParts[1] - newParts[0])) ? null : newParts)
    setInstallments(newParts.length)
    setFirstInstallmentDays(newParts[0])
    setFirstInstallmentDate(calculateDateFromDays(newParts[0], saleDate))
    setDetectedPattern({ interval: detectedPattern.interval, count: newParts.length })
    setTimeout(() => setIsUpdatingFromQuick(false), 100)
  }

  const handlePatternRemove = () => {
    if (!detectedPattern) return
    const parts = quickCondition.split('/').map(p => parseInt(p.trim())).filter(n => !isNaN(n))
    if (parts.length <= 1) return
    const newParts = parts.slice(0, -1)
    setQuickCondition(newParts.join('/'))
    setIsUpdatingFromQuick(true)
    setCustomDaysList(newParts.length <= 2 || newParts.every((_, i) => i === 0 || newParts[i] - newParts[i - 1] === (newParts[1] - newParts[0])) ? null : newParts)
    setInstallments(newParts.length)
    setFirstInstallmentDays(newParts[0])
    setFirstInstallmentDate(calculateDateFromDays(newParts[0], saleDate))
    setDetectedPattern({ interval: detectedPattern.interval, count: newParts.length })
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

    // Don't overwrite quickCondition when using custom (irregular) days
    if (customDaysList) {
      return
    }

    if (!sale && !hasChangedSteppers && !quickCondition) {
      return
    }

    const safeInstallments = getSafeNumber(installments, 1)
    const safeInterval = getSafeNumber(interval, 30)
    const safeFirstDays = getSafeNumber(firstInstallmentDays, safeInstallments === 1 ? 0 : 30)

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
  }, [installments, interval, firstInstallmentDays, isUpdatingFromQuick, sale, hasChangedSteppers, quickCondition, customDaysList])

  const handleInstallmentsChange = (val: number) => {
    setInstallments(val)
    setHasChangedSteppers(true)
    if (val === 1) {
      setFirstInstallmentDays(0)
      setFirstInstallmentDate(saleDate)
    } else if (getSafeNumber(firstInstallmentDays, 0) <= 0) {
      setFirstInstallmentDays(30)
      setFirstInstallmentDate(calculateDateFromDays(30, saleDate))
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="space-y-6">
          <IdentificationSection
            suppliers={suppliersList}
            supplierId={supplierId}
            clientId={clientId}
            clientRefreshTrigger={clientRefreshTrigger}
            showClient={isEdit || !!supplierId}
            isDefaultSupplier={preferences.defaultSupplierId === supplierId && !!supplierId}
            onSupplierChange={handleSupplierChange}
            onClientChange={handleClientChange}
            onSupplierCreated={handleSupplierCreated}
            onDefaultSupplierChange={(checked) => {
              setPreference('defaultSupplierId', checked ? supplierId : null)
            }}
            onClientAddClick={(name) => {
              setClientInitialName(name || '')
              setClientDialogOpen(true)
            }}
          />

          <div
            className={
              (isEdit || !!clientId)
                ? 'space-y-6 animate-[activate-pop_400ms_ease-out_forwards]'
                : 'space-y-6 opacity-40 scale-[0.98] pointer-events-none transition-all duration-300'
            }
            style={{ transformOrigin: 'top center' }}
          >
              <ValuesSection
                informItems={informItems}
                supplierId={supplierId}
                valueEntries={valueEntries}
                removingIds={removingIds}
                swipedItemId={swipedItemId}
                selectedSupplier={selectedSupplier}
                onInformItemsChange={(checked) => {
                  setInformItems(checked)
                  setPreference('saleInformItems', checked)
                }}
                onAddValueEntry={handleAddValueEntry}
                onAddValueEntryAndEdit={handleAddValueEntryAndEdit}
                onRemoveValueEntry={handleRemoveValueEntry}
                onUpdateValueEntry={handleUpdateValueEntry}
                onProductSearchClick={() => {}}
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
                installments={installments}
                interval={interval}
                firstInstallmentDays={firstInstallmentDays}
                quickCondition={quickCondition}
                irregularPatternWarning={irregularPatternWarning}
                customDaysList={customDaysList}
                detectedPattern={detectedPattern}
                onPatternAdd={handlePatternAdd}
                onPatternRemove={handlePatternRemove}
                totalValue={totalValue}
                grossTotal={valueEntries.reduce((sum, entry) => {
                  const qty = informItems ? entry.quantity || 1 : 1
                  return sum + qty * (parseFloat(entry.grossValue) || 0)
                }, 0)}
                totalCommission={valueEntries.reduce((sum, entry) => {
                  const qty = informItems ? entry.quantity || 1 : 1
                  const gross = parseFloat(entry.grossValue) || 0
                  const taxRate = parseFloat(entry.taxRate) || 0
                  const commRate = parseFloat(entry.commissionRate) || 0
                  const base = qty * gross * (1 - taxRate / 100)
                  return sum + base * (commRate / 100)
                }, 0)}
                onSaleDateChange={handleSaleDateChange}
                onFirstInstallmentDateChange={handleFirstDateChange}
                onInstallmentsChange={handleInstallmentsChange}
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
        </div>
      </form>

      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onSuccess={handleClientCreated}
        initialName={clientInitialName}
      />


      {supplierId && (
        <ProductDialog
          open={productDialogOpen}
          onOpenChange={(open) => {
            setProductDialogOpen(open)
            if (!open) setEditProductDialogProduct(null)
          }}
          supplierId={supplierId}
          product={editProductDialogProduct}
          onProductCreated={handleProductCreated}
          showSku={false}
        />
      )}

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
        products={selectedProducts}
        onProductSelect={(product) => {
          if (!editingEntryId) return
          const eid = editingEntryId

          const newCommissionRate = getEffectiveRate(eid, 'commission', product.unit_price?.toString(), product.id)
          const newTaxRate = getEffectiveRate(eid, 'tax', product.unit_price?.toString(), product.id)

          setValueEntries((prev) =>
            prev.map((entry) => {
              if (entry.id === eid) {
                return {
                  ...entry,
                  productId: product.id,
                  productName: product.name,
                  grossValue: product.unit_price?.toString() || entry.grossValue,
                  commissionRate: String(newCommissionRate),
                  taxRate: String(newTaxRate),
                }
              }
              return entry
            })
          )
          toast.success(`Item ${product.name} selecionado`)
        }}
        onEditProduct={(product) => {
          setEditProductDialogProduct(product)
          setProductDialogOpen(true)
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
