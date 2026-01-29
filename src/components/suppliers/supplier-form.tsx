'use client'

import { useState, useImperativeHandle, forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

export type SupplierFormData = {
  name: string
  cnpj?: string
}

export type SupplierFormRef = {
  getData: () => SupplierFormData
  validate: () => boolean
  reset: (data?: { name?: string; cnpj?: string }) => void
}

type Props = {
  initialName?: string
  initialCnpj?: string
  autoFocus?: boolean
}

function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

export const SupplierForm = forwardRef<SupplierFormRef, Props>(
  function SupplierForm({ initialName = '', initialCnpj = '', autoFocus = true }, ref) {
    const [name, setName] = useState(initialName)
    const [cnpj, setCnpj] = useState(initialCnpj ? formatCnpj(initialCnpj) : '')

    useImperativeHandle(ref, () => ({
      getData: () => ({
        name: name.trim(),
        cnpj: cnpj.replace(/\D/g, '') || undefined,
      }),
      validate: () => {
        return name.trim().length > 0
      },
      reset: (data) => {
        setName(data?.name ?? '')
        setCnpj(data?.cnpj ? formatCnpj(data.cnpj) : '')
      },
    }))

    return (
      <div className="space-y-6">
        {/* Campo principal */}
        <div className="space-y-1.5">
          <Label htmlFor="supplier-name" className="text-base font-semibold">
            Nome
          </Label>
          <Input
            id="supplier-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Empresa que você representa"
            required
            autoFocus={autoFocus}
            className="h-[50px] text-base"
          />
        </div>

        {/* Detalhes opcionais (colapsável) */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
            <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
            Detalhes opcionais
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            <div className="space-y-4 mt-3 rounded-lg bg-muted/50 p-4">
              <div className="space-y-2">
                <Label htmlFor="supplier-cnpj" className="text-sm text-muted-foreground">CNPJ</Label>
                <Input
                  id="supplier-cnpj"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Você pode adicionar regras de comissões e taxas depois.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    )
  }
)
