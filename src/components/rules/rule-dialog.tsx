'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { createCommissionRule, updateCommissionRule } from '@/app/actions/commission-rules'
import { toast } from 'sonner'
import type { CommissionRule, CommissionTier } from '@/types'
import { Plus, Trash2 } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  rule?: CommissionRule | null
}

const emptyTier: CommissionTier = { min: 0, max: null, percentage: 0 }

export function RuleDialog({ open, onOpenChange, organizationId, rule }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'fixed' | 'tiered'>('fixed')
  const [percentage, setPercentage] = useState('')
  const [tiers, setTiers] = useState<CommissionTier[]>([{ ...emptyTier }])
  const [isDefault, setIsDefault] = useState(false)
  const [loading, setLoading] = useState(false)

  const isEditing = !!rule

  useEffect(() => {
    if (rule) {
      setName(rule.name)
      setType(rule.type)
      setPercentage(rule.percentage?.toString() || '')
      setTiers(rule.tiers && rule.tiers.length > 0 ? rule.tiers : [{ ...emptyTier }])
      setIsDefault(rule.is_default)
    } else {
      setName('')
      setType('fixed')
      setPercentage('')
      setTiers([{ ...emptyTier }])
      setIsDefault(false)
    }
  }, [rule, open])

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
    // Garante que a última faixa não tem limite superior
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        organization_id: organizationId,
        name,
        type,
        percentage: type === 'fixed' ? parseFloat(percentage) : undefined,
        tiers: type === 'tiered' ? tiers : undefined,
        is_default: isDefault,
      }

      if (isEditing && rule) {
        const result = await updateCommissionRule(rule.id, organizationId, {
          name,
          type,
          percentage: type === 'fixed' ? parseFloat(percentage) : null,
          tiers: type === 'tiered' ? tiers : null,
          is_default: isDefault,
        })

        if (result.success) {
          toast.success('Regra atualizada')
          onOpenChange(false)
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createCommissionRule(payload)

        if (result.success) {
          toast.success('Regra criada')
          onOpenChange(false)
        } else {
          toast.error(result.error)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Regra' : 'Nova Regra de Comissão'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Comissão Padrão"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
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
              <Label htmlFor="percentage">Percentual (%) *</Label>
              <Input
                id="percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="5"
                required
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
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-md">
                    <div className="flex-1 grid grid-cols-3 gap-2">
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isDefault" className="font-normal">
              Definir como regra padrão (aplicada a vendedores sem regra específica)
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

