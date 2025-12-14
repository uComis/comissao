'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createPersonalClient } from '@/app/actions/personal-clients'
import { toast } from 'sonner'
import type { PersonalClient } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName?: string
  onSuccess: (client: PersonalClient) => void
}

export function ClientDialog({ open, onOpenChange, initialName = '', onSuccess }: Props) {
  const [saving, setSaving] = useState(false)
  const [documentType, setDocumentType] = useState<'none' | 'cpf' | 'cnpj'>('none')
  
  // Form state
  const [name, setName] = useState(initialName)
  const [cpf, setCpf] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  // Reset form when dialog opens with new name
  useState(() => {
    if (open) {
      setName(initialName)
      setCpf('')
      setCnpj('')
      setPhone('')
      setEmail('')
      setNotes('')
      setDocumentType('none')
    }
  })

  function formatCpf(value: string): string {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  function formatCnpj(value: string): string {
    const numbers = value.replace(/\D/g, '').slice(0, 14)
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }

  function formatPhone(value: string): string {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    setSaving(true)

    try {
      const result = await createPersonalClient({
        name: name.trim(),
        cpf: documentType === 'cpf' ? cpf.replace(/\D/g, '') : null,
        cnpj: documentType === 'cnpj' ? cnpj.replace(/\D/g, '') : null,
        phone: phone.replace(/\D/g, '') || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      })

      if (result.success) {
        toast.success('Cliente cadastrado')
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Nome *</Label>
            <Input
              id="client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do cliente ou empresa"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Documento</Label>
            <Tabs value={documentType} onValueChange={(v) => setDocumentType(v as 'none' | 'cpf' | 'cnpj')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="none">Nenhum</TabsTrigger>
                <TabsTrigger value="cpf">CPF</TabsTrigger>
                <TabsTrigger value="cnpj">CNPJ</TabsTrigger>
              </TabsList>
              <TabsContent value="cpf" className="mt-2">
                <Input
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                />
              </TabsContent>
              <TabsContent value="cnpj" className="mt-2">
                <Input
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                  placeholder="00.000.000/0000-00"
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-phone">Telefone</Label>
              <Input
                id="client-phone"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-notes">Observações</Label>
            <Textarea
              id="client-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações sobre o cliente..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

