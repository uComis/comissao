'use client'

import { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CommissionRule, CommissionTier } from '@/types'
import { Plus, Trash2 } from 'lucide-react'

export type RuleFormData = {
  name: string
  type: 'fixed' | 'tiered'
  percentage: number | null
  tiers: CommissionTier[] | null
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
  const [percentage, setPercentage] = useState('')
  const [tiers, setTiers] = useState<CommissionTier[]>([{ ...emptyTier }])
  const [isDefault, setIsDefault] = useState(false)

  const reset = useCallback(() => {
    setName('')
    setType('fixed')
    setPercentage('')
    setTiers([{ ...emptyTier }])
    setIsDefault(false)
  }, [])

  const getData = useCallback((): RuleFormData => {
    return {
      name,
      type,
      percentage: type === 'fixed' && percentage ? parseFloat(percentage) : null,
      tiers: type === 'tiered' ? tiers : null,
      is_default: isDefault,
    }
  }, [name, type, percentage, tiers, isDefault])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (rule) {
        setName(rule.name)
        setType(rule.type)
        setPercentage(rule.percentage?.toString() || '')
        setTiers(rule.tiers && rule.tiers.length > 0 ? rule.tiers : [{ ...emptyTier }])
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

  function validate(): boolean {
    if (showName && !name.trim()) return false
    if (type === 'fixed' && !percentage) return false
    if (type === 'tiered' && tiers.length === 0) return false
    return true
  }

  useImperativeHandle(ref, () => ({
    getData,
    validate,
    reset,
  }))

  function addTier() {
    const lastTier = tiers[tiers.length - 1]
    const newMin = lastTier.max ?? 0
    setTiers([
      ...tiers.slice(0, -1),
      { ...lastTier, max: newMin },
      { min: newMin, max: null, percentage: 0 },
    ])
  }

  function removeTier(index: number) {
    if (tiers.length <= 1) return
    const newTiers = tiers.filter((_, i) => i !== index)
    if (newTiers.length > 0) {
      newTiers[newTiers.length - 1].max = null
    }
    setTiers(newTiers)
  }

  function updateTier(index: number, field: keyof CommissionTier, value: number | null) {
    const newTiers = [...tiers]
    newTiers[index] = { ...newTiers[index], [field]: value }
    setTiers(newTiers)
  }

  return (
    <div className="space-y-4">
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

      <div className="space-y-2">
        <Label htmlFor="ruleType">Tipo de Cálculo *</Label>
        <Select value={type} onValueChange={(v) => setType(v as 'fixed' | 'tiered')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Percentual Fixo</SelectItem>
            <SelectItem value="tiered">Escalonada (Faixas)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === 'fixed' && (
        <div className="space-y-2">
          <Label htmlFor="rulePercentage">Percentual (%) *</Label>
          <Input
            id="rulePercentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            placeholder="Ex: 5"
          />
        </div>
      )}

      {type === 'tiered' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Faixas de Comissão</Label>
            <Button type="button" variant="outline" size="sm" onClick={addTier}>
              <Plus className="h-4 w-4 mr-1" />
              Faixa
            </Button>
          </div>

          <div className="space-y-2">
            {tiers.map((tier, index) => (
              <div key={index} className={`flex items-center gap-2 p-3 border rounded-md ${compact ? 'p-2' : ''}`}>
                <div className={`flex-1 grid gap-2 ${compact ? 'grid-cols-3' : 'grid-cols-3'}`}>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Mínimo (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tier.min}
                      onChange={(e) => updateTier(index, 'min', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {index === tiers.length - 1 ? 'Máximo' : 'Máximo (R$)'}
                    </Label>
                    <Input
                      type="number"
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
                      disabled={index === tiers.length - 1}
                      placeholder={index === tiers.length - 1 ? 'ilimitado' : ''}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Comissão (%)</Label>
                    <Input
                      type="number"
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
                {tiers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTier(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            A última faixa sempre terá valor máximo ilimitado
          </p>
        </div>
      )}

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

