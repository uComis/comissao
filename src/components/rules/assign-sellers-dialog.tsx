'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { assignRuleToSellers } from '@/app/actions/commission-rules'
import { toast } from 'sonner'
import type { CommissionRuleWithSellers } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  rule: CommissionRuleWithSellers | null
  sellers: Array<{ id: string; name: string }>
}

export function AssignSellersDialog({
  open,
  onOpenChange,
  organizationId,
  rule,
  sellers,
}: Props) {
  const [selectedSellers, setSelectedSellers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (rule) {
      setSelectedSellers(rule.sellers.map((s) => s.id))
    } else {
      setSelectedSellers([])
    }
  }, [rule, open])

  function toggleSeller(sellerId: string) {
    setSelectedSellers((prev) =>
      prev.includes(sellerId)
        ? prev.filter((id) => id !== sellerId)
        : [...prev, sellerId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rule) return

    setLoading(true)

    try {
      const result = await assignRuleToSellers(rule.id, selectedSellers, organizationId)

      if (result.success) {
        toast.success('Vendedores vinculados')
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!rule) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular Vendedores</DialogTitle>
          <DialogDescription>
            Selecione os vendedores que devem usar a regra &quot;{rule.name}&quot;
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[300px] pr-4">
            {sellers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum vendedor cadastrado
              </p>
            ) : (
              <div className="space-y-2">
                {sellers.map((seller) => (
                  <label
                    key={seller.id}
                    className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSellers.includes(seller.id)}
                      onChange={() => toggleSeller(seller.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span>{seller.name}</span>
                  </label>
                ))}
              </div>
            )}
          </ScrollArea>

          <p className="text-muted-foreground text-xs mt-4">
            {selectedSellers.length} vendedor{selectedSellers.length !== 1 ? 'es' : ''} selecionado
            {selectedSellers.length !== 1 ? 's' : ''}
          </p>

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
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

