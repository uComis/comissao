'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateCommissionGoal } from '@/app/actions/user-preferences'
import { toast } from 'sonner'
import { Target } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentGoal: number
  onSuccess?: () => void
}

export function GoalDialog({ open, onOpenChange, currentGoal, onSuccess }: Props) {
  const [goal, setGoal] = useState(currentGoal.toString())
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const numericGoal = parseFloat(goal.replace(',', '.'))
    if (isNaN(numericGoal)) {
      toast.error('Por favor, insira um valor válido')
      setLoading(false)
      return
    }

    const result = await updateCommissionGoal(numericGoal)

    if (result.success) {
      toast.success('Meta atualizada com sucesso!')
      onSuccess?.()
      onOpenChange(false)
    } else {
      toast.error(result.error)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Target className="h-6 w-6" />
            </div>
            <DialogTitle>Meta de Comissão</DialogTitle>
            <DialogDescription>
              Defina sua meta de comissão mensal para acompanhar seu progresso no painel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="goal">Valor da Meta (R$)</Label>
              <Input
                id="goal"
                type="text"
                inputMode="decimal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Ex: 5000,00"
                autoFocus
              />
            </div>
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
              {loading ? 'Salvando...' : 'Salvar Meta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

