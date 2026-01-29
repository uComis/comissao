'use client'

import { useRef, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { createPersonalClient, updatePersonalClient } from '@/app/actions/personal-clients'
import { toast } from 'sonner'
import { ClientForm, type ClientFormRef } from './client-form'
import type { PersonalClient } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: PersonalClient | null
  initialName?: string
  onSuccess: (client: PersonalClient) => void
}

export function ClientDialog({ open, onOpenChange, client, initialName = '', onSuccess }: Props) {
  const formRef = useRef<ClientFormRef>(null)
  const [saving, setSaving] = useState(false)

  const isEditing = !!client

  useEffect(() => {
    if (open) {
      if (client) {
        formRef.current?.reset({
          name: client.name,
          cpf: client.cpf || '',
          cnpj: client.cnpj || '',
          phone: client.phone || '',
          email: client.email || '',
          notes: client.notes || '',
          documentType: client.cpf ? 'cpf' : 'cnpj',
        })
      } else {
        formRef.current?.reset({ name: initialName })
      }
    }
  }, [open, client, initialName])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formRef.current?.validate()) {
      toast.error('Nome é obrigatório')
      return
    }

    setSaving(true)

    try {
      const data = formRef.current.getData()

      const payload = {
        name: data.name,
        cpf: data.cpf || null,
        cnpj: data.cnpj || null,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
      }

      const result = isEditing
        ? await updatePersonalClient(client.id, payload)
        : await createPersonalClient(payload)

      if (result.success) {
        toast.success(isEditing ? 'Cliente atualizado' : 'Cliente cadastrado')
        onSuccess(result.data)
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="top-[20%] translate-y-0">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle>{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing ? 'Editar dados do cliente' : 'Cadastrar novo cliente'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ClientForm
            ref={formRef}
            initialName={isEditing ? client!.name : initialName}
            initialData={isEditing ? {
              cpf: client!.cpf || '',
              cnpj: client!.cnpj || '',
              phone: client!.phone || '',
              email: client!.email || '',
              notes: client!.notes || '',
            } : undefined}
            defaultOpen={false}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
