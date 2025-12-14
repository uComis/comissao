'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createCommissionRule, updateCommissionRule } from '@/app/actions/commission-rules'
import { toast } from 'sonner'
import type { CommissionRule } from '@/types'
import { RuleForm, type RuleFormRef } from './rule-form'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  rule?: CommissionRule | null
}

export function RuleDialog({ open, onOpenChange, organizationId, rule }: Props) {
  const formRef = useRef<RuleFormRef>(null)
  const [loading, setLoading] = useState(false)

  const isEditing = !!rule

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formRef.current?.validate()) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)

    try {
      const formData = formRef.current.getData()

      if (isEditing && rule) {
        const result = await updateCommissionRule(rule.id, organizationId, {
          name: formData.name,
          type: formData.type,
          percentage: formData.percentage,
          tiers: formData.tiers,
          is_default: formData.is_default,
        })

        if (result.success) {
          toast.success('Regra atualizada')
          onOpenChange(false)
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createCommissionRule({
          organization_id: organizationId,
          name: formData.name,
          type: formData.type,
          percentage: formData.percentage ?? undefined,
          tiers: formData.tiers ?? undefined,
          is_default: formData.is_default,
        })

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
          <RuleForm ref={formRef} rule={rule} />

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
