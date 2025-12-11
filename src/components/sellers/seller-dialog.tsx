'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSeller, updateSeller, setSellerRule } from '@/app/actions/sellers'
import { getActiveCommissionRules } from '@/app/actions/commission-rules'
import { toast } from 'sonner'
import { Lock, Pencil } from 'lucide-react'
import type { Seller, SellerWithRule, CommissionRule } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  seller?: Seller | SellerWithRule | null
}

export function SellerDialog({ open, onOpenChange, organizationId, seller }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pipedriveId, setPipedriveId] = useState('')
  const [pipedriveIdLocked, setPipedriveIdLocked] = useState(true)
  const [ruleId, setRuleId] = useState<string>('__default__')
  const [rules, setRules] = useState<CommissionRule[]>([])
  const [loading, setLoading] = useState(false)

  const isEditing = !!seller
  const hasPipedriveId = !!seller?.pipedrive_id
  const sellerWithRule = seller && 'commission_rule' in seller ? seller : null
  const currentRuleId = sellerWithRule?.commission_rule?.id || ''
  const isDefaultRule = sellerWithRule?.commission_rule?.is_default ?? false

  useEffect(() => {
    async function loadRules() {
      const data = await getActiveCommissionRules(organizationId)
      setRules(data)
    }
    if (open) {
      loadRules()
    }
  }, [open, organizationId])

  useEffect(() => {
    if (seller) {
      setName(seller.name)
      setEmail(seller.email || '')
      setPipedriveId(seller.pipedrive_id?.toString() || '')
      setPipedriveIdLocked(true)
      // Se tem regra específica (não default), usa ela; senão, usa __default__
      setRuleId(currentRuleId && !isDefaultRule ? currentRuleId : '__default__')
    } else {
      setName('')
      setEmail('')
      setPipedriveId('')
      setPipedriveIdLocked(true)
      setRuleId('__default__')
    }
  }, [seller, open, currentRuleId, isDefaultRule])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEditing && seller) {
        const result = await updateSeller(seller.id, {
          name,
          email: email || undefined,
          pipedrive_id: pipedriveId ? parseInt(pipedriveId) : null,
        })

        if (result.success) {
          // Atualiza regra se mudou
          const previousRuleId = currentRuleId && !isDefaultRule ? currentRuleId : '__default__'
          if (ruleId !== previousRuleId) {
            const newRuleId = ruleId === '__default__' ? null : ruleId
            await setSellerRule(seller.id, newRuleId, organizationId)
          }
          toast.success('Vendedor atualizado')
          onOpenChange(false)
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createSeller({
          organization_id: organizationId,
          name,
          email: email || undefined,
          pipedrive_id: pipedriveId ? parseInt(pipedriveId) : undefined,
        })

        if (result.success && ruleId !== '__default__') {
          // Define regra para novo vendedor
          await setSellerRule(result.data.id, ruleId, organizationId)
          toast.success('Vendedor criado')
          onOpenChange(false)
        } else if (result.success) {
          toast.success('Vendedor criado')
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Vendedor' : 'Novo Vendedor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do vendedor"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pipedriveId">ID do Pipedrive</Label>
            <div className="flex gap-2">
              <Input
                id="pipedriveId"
                type="number"
                value={pipedriveId}
                onChange={(e) => setPipedriveId(e.target.value)}
                placeholder="ID do usuário no Pipedrive"
                disabled={isEditing && hasPipedriveId && pipedriveIdLocked}
                className={isEditing && hasPipedriveId && pipedriveIdLocked ? 'bg-muted' : ''}
              />
              {isEditing && hasPipedriveId && pipedriveIdLocked && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPipedriveIdLocked(false)}
                  title="Desbloquear edição"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {isEditing && hasPipedriveId && !pipedriveIdLocked && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setPipedriveId(seller?.pipedrive_id?.toString() || '')
                    setPipedriveIdLocked(true)
                  }}
                  title="Cancelar edição"
                >
                  <Lock className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {isEditing && hasPipedriveId && pipedriveIdLocked
                ? 'Campo bloqueado. Clique no ícone para editar.'
                : 'Vincule ao usuário do Pipedrive para associar vendas automaticamente'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule">Regra de Comissão</Label>
            <Select value={ruleId} onValueChange={setRuleId}>
              <SelectTrigger>
                <SelectValue placeholder="Usar regra padrão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">Usar regra padrão</SelectItem>
                {rules.map((rule) => (
                  <SelectItem key={rule.id} value={rule.id}>
                    {rule.name} {rule.is_default && '(padrão)'} - {rule.type === 'fixed' ? `${rule.percentage}%` : 'Escalonada'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Deixe vazio para usar a regra padrão da organização
            </p>
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

