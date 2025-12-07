'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSeller, updateSeller } from '@/app/actions/sellers'
import { toast } from 'sonner'
import type { Seller, SellerWithRule } from '@/types'

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
  const [loading, setLoading] = useState(false)

  const isEditing = !!seller

  useEffect(() => {
    if (seller) {
      setName(seller.name)
      setEmail(seller.email || '')
      setPipedriveId(seller.pipedrive_id?.toString() || '')
    } else {
      setName('')
      setEmail('')
      setPipedriveId('')
    }
  }, [seller, open])

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

        if (result.success) {
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
            <Input
              id="pipedriveId"
              type="number"
              value={pipedriveId}
              onChange={(e) => setPipedriveId(e.target.value)}
              placeholder="ID do usuário no Pipedrive"
            />
            <p className="text-muted-foreground text-xs">
              Vincule ao usuário do Pipedrive para associar vendas automaticamente
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

