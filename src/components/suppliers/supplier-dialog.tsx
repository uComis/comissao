'use client'

import { useState, useRef, useEffect } from 'react'
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
import { RuleForm, type RuleFormRef } from '@/components/rules'
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
  const ruleFormRef = useRef<RuleFormRef>(null)

  const [name, setName] = useState(initialName)
  const [cnpj, setCnpj] = useState('')
  const [hasCommission, setHasCommission] = useState(false)
  const [loading, setLoading] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName(initialName)
      setCnpj('')
      setHasCommission(false)
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

    if (hasCommission && !ruleFormRef.current?.validate()) {
      toast.error('Configure a regra de comissão')
      return
    }

    setLoading(true)

    try {
      const ruleData = hasCommission && ruleFormRef.current ? ruleFormRef.current.getData() : null
      const cleanCnpj = cnpj.replace(/\D/g, '') || undefined

      const result = await createPersonalSupplierWithRule({
        name,
        cnpj: cleanCnpj,
        rule: ruleData ? {
          name: ruleData.name || `${name} - Regra`,
          type: ruleData.type,
          target: ruleData.target,
          percentage: ruleData.percentage,
          tiers: ruleData.tiers,
          is_default: ruleData.is_default,
        } : null,
      })

      if (result.success) {
        toast.success('Fornecedor criado')
        onSuccess(result.data)
        onOpenChange(false)
        setName('')
        setCnpj('')
        setHasCommission(false)
      } else {
        toast.error(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
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
              <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                <div className="space-y-4 pt-3">
                  <div className="space-y-2">
                    <Label htmlFor="supplier-cnpj" className="text-sm text-muted-foreground">CNPJ</Label>
                    <Input
                      id="supplier-cnpj"
                      value={cnpj}
                      onChange={(e) => handleCnpjChange(e.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>

                  <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">Regra de Comissão</Label>
                        <p className="text-sm text-muted-foreground">
                          Você pode configurar depois.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="has-commission"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={hasCommission}
                          onChange={(e) => setHasCommission(e.target.checked)}
                        />
                        <Label htmlFor="has-commission" className="font-normal cursor-pointer">
                          Configurar agora
                        </Label>
                      </div>
                    </div>

                    {hasCommission && (
                      <div className="pt-2 border-t mt-2">
                        <RuleForm
                          ref={ruleFormRef}
                          showName={false}
                          showDefault={false}
                        />
                      </div>
                    )}
                  </div>
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
