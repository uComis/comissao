'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createPersonalSupplierWithRule } from '@/app/actions/personal-suppliers'
import { toast } from 'sonner'
import { Loader2, ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (supplier: PersonalSupplierWithRules) => void
  initialName?: string
}

export function SupplierDialog({ open, onOpenChange, onSuccess, initialName = '' }: Props) {
  const [name, setName] = useState(initialName)
  const [cnpj, setCnpj] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName(initialName)
      setCnpj('')
    }
  }, [open, initialName])

  function formatCnpj(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
  }

  function handleCnpjChange(value: string) {
    setCnpj(formatCnpj(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    setLoading(true)

    try {
      const cleanCnpj = cnpj.replace(/\D/g, '') || undefined

      const result = await createPersonalSupplierWithRule({
        name,
        cnpj: cleanCnpj,
        rule: null,
      })

      if (result.success) {
        toast.success('Fornecedor criado')
        onSuccess(result.data)
        onOpenChange(false)
        setName('')
        setCnpj('')
      } else {
        toast.error(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="top-[20%] translate-y-0">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle>Nova Pasta</DialogTitle>
            <DialogDescription className="sr-only">
              Criar nova pasta de fornecedor
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                autoFocus
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
                      onChange={(e) => handleCnpjChange(e.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Você pode adicionar regras de comissões e taxas depois.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Pasta
              </Button>
            </div>
          </form>
      </DialogContent>
    </Dialog>
  )
}
