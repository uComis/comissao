'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer'
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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
          commission_percentage: formData.commission_percentage,
          tax_percentage: formData.tax_percentage,
          commission_tiers: formData.commission_tiers,
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
          commission_percentage: formData.commission_percentage ?? undefined,
          tax_percentage: formData.tax_percentage ?? undefined,
          commission_tiers: formData.commission_tiers ?? undefined,
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

  const title = isEditing ? 'Editar Regra' : 'Nova Regra de Comissão'

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1">
      <div className="flex-1 overflow-y-auto px-4 sm:px-0">
        <RuleForm ref={formRef} rule={rule} />
      </div>

      {isMobile ? (
        <DrawerFooter className="border-t">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full"
          >
            Cancelar
          </Button>
        </DrawerFooter>
      ) : (
        <DialogFooter className="mt-4">
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
      )}
    </form>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          {formContent}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  )
}
