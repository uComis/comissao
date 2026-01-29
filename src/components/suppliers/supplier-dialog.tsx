'use client'

import { useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createPersonalSupplierWithRule, updatePersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { SupplierForm, type SupplierFormRef } from './supplier-form'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (supplier: PersonalSupplierWithRules) => void
  initialName?: string
  editingSupplier?: PersonalSupplierWithRules | null
}

export function SupplierDialog({ open, onOpenChange, onSuccess, initialName = '', editingSupplier }: Props) {
  const formRef = useRef<SupplierFormRef>(null)
  const [loading, setLoading] = useState(false)

  const isEditing = !!editingSupplier

  useEffect(() => {
    if (open) {
      if (editingSupplier) {
        formRef.current?.reset({ name: editingSupplier.name, cnpj: editingSupplier.cnpj || '' })
      } else {
        formRef.current?.reset({ name: initialName })
      }
    }
  }, [open, initialName, editingSupplier])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formRef.current?.validate()) {
      toast.error('Nome é obrigatório')
      return
    }

    setLoading(true)

    try {
      const data = formRef.current.getData()

      if (isEditing) {
        const result = await updatePersonalSupplierWithRules(editingSupplier!.id, {
          name: data.name,
          cnpj: data.cnpj,
        })

        if (result.success) {
          toast.success('Fornecedor atualizado')
          onSuccess(result.data)
          onOpenChange(false)
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createPersonalSupplierWithRule({
          name: data.name,
          cnpj: data.cnpj,
          rule: null,
        })

        if (result.success) {
          toast.success('Fornecedor criado')
          onSuccess(result.data)
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
      <DialogContent showCloseButton={false} className="top-[20%] translate-y-0">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle>{isEditing ? 'Editar Pasta' : 'Nova Pasta'}</DialogTitle>
            <DialogDescription className="sr-only">
              {isEditing ? 'Editar pasta de fornecedor' : 'Criar nova pasta de fornecedor'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <SupplierForm
              ref={formRef}
              initialName={isEditing ? editingSupplier!.name : initialName}
              initialCnpj={isEditing ? editingSupplier!.cnpj || '' : ''}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar' : 'Criar Pasta'}
              </Button>
            </div>
          </form>
      </DialogContent>
    </Dialog>
  )
}
