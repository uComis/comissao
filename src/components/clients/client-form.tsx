'use client'

import { useState, useImperativeHandle, forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

export type ClientFormData = {
  name: string
  cpf?: string
  cnpj?: string
  phone?: string
  email?: string
  notes?: string
}

export type ClientFormRef = {
  getData: () => ClientFormData
  validate: () => boolean
  reset: (data?: {
    name?: string
    cpf?: string
    cnpj?: string
    phone?: string
    email?: string
    notes?: string
    documentType?: 'cpf' | 'cnpj'
  }) => void
}

type Props = {
  initialName?: string
  initialData?: {
    cpf?: string
    cnpj?: string
    phone?: string
    email?: string
    notes?: string
  }
  autoFocus?: boolean
  defaultOpen?: boolean
}

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

export const ClientForm = forwardRef<ClientFormRef, Props>(
  function ClientForm({ initialName = '', initialData, autoFocus = true, defaultOpen = false }, ref) {
    const [name, setName] = useState(initialName)
    const [documentType, setDocumentType] = useState<'cpf' | 'cnpj'>(
      initialData?.cpf ? 'cpf' : 'cnpj'
    )
    const [cpf, setCpf] = useState(initialData?.cpf ? formatCpf(initialData.cpf) : '')
    const [cnpj, setCnpj] = useState(initialData?.cnpj ? formatCnpj(initialData.cnpj) : '')
    const [phone, setPhone] = useState(initialData?.phone ? formatPhone(initialData.phone) : '')
    const [email, setEmail] = useState(initialData?.email || '')
    const [notes, setNotes] = useState(initialData?.notes || '')

    useImperativeHandle(ref, () => ({
      getData: () => ({
        name: name.trim(),
        cpf: documentType === 'cpf' ? cpf.replace(/\D/g, '') || undefined : undefined,
        cnpj: documentType === 'cnpj' ? cnpj.replace(/\D/g, '') || undefined : undefined,
        phone: phone.replace(/\D/g, '') || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
      validate: () => name.trim().length > 0,
      reset: (data) => {
        setName(data?.name ?? '')
        setCpf(data?.cpf ? formatCpf(data.cpf) : '')
        setCnpj(data?.cnpj ? formatCnpj(data.cnpj) : '')
        setPhone(data?.phone ? formatPhone(data.phone) : '')
        setEmail(data?.email ?? '')
        setNotes(data?.notes ?? '')
        setDocumentType(data?.documentType ?? (data?.cpf ? 'cpf' : 'cnpj'))
      },
    }))

    return (
      <div className="space-y-6">
        {/* Campo principal */}
        <div className="space-y-1.5">
          <Label htmlFor="client-name" className="text-base font-semibold">
            Nome
          </Label>
          <Input
            id="client-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do cliente ou empresa"
            required
            autoFocus={autoFocus}
            className="h-[50px] text-base"
          />
        </div>

        {/* Detalhes opcionais (colapsável) */}
        <Collapsible defaultOpen={defaultOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
            <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
            Detalhes opcionais
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            <div className="space-y-4 mt-3 rounded-lg bg-muted/50 p-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Documento</Label>
                <Tabs value={documentType} onValueChange={(v) => setDocumentType(v as 'cpf' | 'cnpj')}>
                  <TabsList className="grid w-full grid-cols-2">
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

              <div className="space-y-2">
                <Label htmlFor="client-phone" className="text-sm text-muted-foreground">Telefone</Label>
                <Input
                  id="client-phone"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-email" className="text-sm text-muted-foreground">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-notes" className="text-sm text-muted-foreground">Observações</Label>
                <Textarea
                  id="client-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anotações sobre o cliente..."
                  rows={2}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Você pode completar esses dados depois.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    )
  }
)
