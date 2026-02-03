'use client'

import { useState, useEffect, useImperativeHandle, forwardRef, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DashedActionButton } from '@/components/ui/dashed-action-button'
import { CompactNumberInput } from '@/components/ui/compact-number-input'
import type { CommissionRule, CommissionTier } from '@/types'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type RuleFormData = {
  name: string
  type: 'fixed' | 'tiered'
  commission_percentage: number | null
  tax_percentage: number | null
  commission_tiers: CommissionTier[] | null
  tax_tiers: CommissionTier[] | null
  is_default: boolean
}

export type RuleFormRef = {
  getData: () => RuleFormData
  validate: () => boolean
  reset: () => void
}

type Props = {
  rule?: CommissionRule | null
  showName?: boolean
  showDefault?: boolean
  compact?: boolean
  onChange?: (data: RuleFormData) => void
}

const emptyTier: CommissionTier = { min: 0, max: null, percentage: 0 }

export const RuleForm = forwardRef<RuleFormRef, Props>(function RuleForm(
  { rule, showName = true, showDefault = true, compact = false, onChange },
  ref
) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'fixed' | 'tiered'>('fixed')
  const [commissionPercentage, setCommissionPercentage] = useState(0)
  const [taxPercentage, setTaxPercentage] = useState(0)
  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[]>([{ ...emptyTier }])
  const [isDefault, setIsDefault] = useState(false)

  // Animation state
  const [fadeState, setFadeState] = useState<'visible' | 'fading-out' | 'fading-in'>('visible')
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto')

  const reset = useCallback(() => {
    setName('')
    setType('fixed')
    setCommissionPercentage(0)
    setTaxPercentage(0)
    setCommissionTiers([{ ...emptyTier }])
    setIsDefault(false)
  }, [])

  const getData = useCallback((): RuleFormData => {
    return {
      name,
      type,
      commission_percentage: type === 'fixed' ? commissionPercentage : null,
      tax_percentage: type === 'fixed' ? taxPercentage : null,
      commission_tiers: type === 'tiered' ? commissionTiers : null,
      tax_tiers: null,
      is_default: isDefault,
    }
  }, [name, type, commissionPercentage, taxPercentage, commissionTiers, isDefault])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (rule) {
        setName(rule.name)
        setType(rule.type)
        setCommissionPercentage(rule.commission_percentage ?? 0)
        setTaxPercentage(rule.tax_percentage ?? 0)
        setCommissionTiers(rule.commission_tiers && rule.commission_tiers.length > 0 ? rule.commission_tiers : [{ ...emptyTier }])
        setIsDefault(rule.is_default)
      } else {
        reset()
      }
    }, 0)
    return () => clearTimeout(timeout)
  }, [rule, reset])

  useEffect(() => {
    if (onChange) {
      onChange(getData())
    }
  }, [onChange, getData])

  // Measure content height after render
  useEffect(() => {
    if (contentRef.current && fadeState === 'visible') {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [type, fadeState, commissionTiers.length])

  function validate(): boolean {
    if (showName && !name.trim()) return false
    if (type === 'fixed' && commissionPercentage === 0 && taxPercentage === 0) return false
    if (type === 'tiered' && commissionTiers.length === 0) return false
    return true
  }

  useImperativeHandle(ref, () => ({
    getData,
    validate,
    reset,
  }))

  const switchType = useCallback((toType: 'fixed' | 'tiered') => {
    if (toType === type) return
    // Start fade out
    setFadeState('fading-out')
    setTimeout(() => {
      // Apply the actual change
      setType(toType)
      // Start fade in
      setFadeState('fading-in')
      // Measure new height after state update
      requestAnimationFrame(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.scrollHeight)
        }
      })
      setTimeout(() => {
        setFadeState('visible')
      }, 200)
    }, 150)
  }, [type])

  function addTier() {
    const lastTier = commissionTiers[commissionTiers.length - 1]
    const newMin = lastTier.max ?? 0
    setCommissionTiers([
      ...commissionTiers.slice(0, -1),
      { ...lastTier, max: newMin },
      { min: newMin, max: null, percentage: 0 },
    ])
  }

  function removeTier(index: number) {
    if (commissionTiers.length <= 1) return
    const newTiers = commissionTiers.filter((_, i) => i !== index)
    if (newTiers.length > 0) {
      newTiers[newTiers.length - 1].max = null
    }
    setCommissionTiers(newTiers)
  }

  function updateTier(index: number, field: keyof CommissionTier, value: number | null) {
    const newTiers = [...commissionTiers]
    newTiers[index] = { ...newTiers[index], [field]: value }
    setCommissionTiers(newTiers)
  }

  return (
    <div className="space-y-4">
      {/* Segmented control - tipo de regra */}
      <div className="space-y-2">
        <Label>Tipo de Regra</Label>
        <div className="grid grid-cols-2 gap-1 p-1 bg-muted/50 rounded-lg">
          <button
            type="button"
            onClick={() => switchType('fixed')}
            className={cn(
              'py-2.5 text-sm font-medium rounded-md transition-all',
              type === 'fixed'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Percentual Fixo
          </button>
          <button
            type="button"
            onClick={() => switchType('tiered')}
            className={cn(
              'py-2.5 text-sm font-medium rounded-md transition-all',
              type === 'tiered'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Faixa de Preço
          </button>
        </div>
      </div>

      {/* Nome da regra */}
      {showName && (
        <div className="space-y-2">
          <Label htmlFor="ruleName">Nome da Regra *</Label>
          <Input
            id="ruleName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Comissão Padrão"
          />
        </div>
      )}

      {/* Animated content area */}
      <div
        className="overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{ height: contentHeight === 'auto' ? 'auto' : contentHeight }}
      >
        <div
          ref={contentRef}
          className={cn(
            'transition-opacity duration-150 ease-in-out',
            fadeState === 'fading-out' && 'opacity-0',
            fadeState === 'fading-in' && 'opacity-0 animate-[fadeIn_200ms_ease-in-out_forwards]',
            fadeState === 'visible' && 'opacity-100',
          )}
        >
          {/* Percentuais fixos */}
          {type === 'fixed' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Comissão (%)</Label>
                <CompactNumberInput
                  value={commissionPercentage}
                  onChange={setCommissionPercentage}
                  min={0}
                  max={100}
                  step={0.5}
                  decimals={2}
                  suffix="%"
                />
              </div>
              <div className="space-y-2">
                <Label>Taxa/Imposto (%)</Label>
                <CompactNumberInput
                  value={taxPercentage}
                  onChange={setTaxPercentage}
                  min={0}
                  max={100}
                  step={0.5}
                  decimals={2}
                  suffix="%"
                />
              </div>
            </div>
          )}

          {/* Faixas de preço */}
          {type === 'tiered' && (
            <div className="space-y-3">
              <Label>Faixas de Comissão</Label>

              <div className="space-y-3">
                {commissionTiers.map((tier, index) => (
                  <div key={index} className={cn('p-3 border rounded-lg', compact && 'p-2')}>
                    <div className="flex items-start justify-between gap-2 mb-2 sm:hidden">
                      <span className="text-sm font-medium text-muted-foreground">Faixa {index + 1}</span>
                      {commissionTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTier(index)}
                          className="text-destructive hover:text-destructive/80 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Mínimo (R$)</Label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={tier.min}
                            onChange={(e) => updateTier(index, 'min', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            {index === commissionTiers.length - 1 ? 'Máximo' : 'Máximo (R$)'}
                          </Label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={tier.max ?? ''}
                            onChange={(e) =>
                              updateTier(
                                index,
                                'max',
                                e.target.value ? parseFloat(e.target.value) : null
                              )
                            }
                            disabled={index === commissionTiers.length - 1}
                            placeholder={index === commissionTiers.length - 1 ? 'ilimitado' : ''}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Comissão (%)</Label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="100"
                            step="0.01"
                            value={tier.percentage}
                            onChange={(e) =>
                              updateTier(index, 'percentage', parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      </div>
                      {commissionTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTier(index)}
                          className="hidden sm:block text-destructive hover:text-destructive/80 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <DashedActionButton onClick={addTier} icon={<Plus className="h-4 w-4" />}>
                Adicionar Faixa
              </DashedActionButton>

              <p className="text-muted-foreground text-xs">
                A última faixa sempre terá valor máximo ilimitado
              </p>
            </div>
          )}
        </div>
      </div>

      {showDefault && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ruleIsDefault"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="ruleIsDefault" className="font-normal">
            Definir como regra padrão (aplicada a vendedores sem regra específica)
          </Label>
        </div>
      )}
    </div>
  )
})
