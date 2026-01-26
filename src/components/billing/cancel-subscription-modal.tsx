'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertCircle, Calendar, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cancelSubscription } from '@/app/actions/billing/subscriptions'
import { toast } from 'sonner'

interface CancelSubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlan: string
  periodEnd: string | null
  onSuccess?: () => void
}

export function CancelSubscriptionModal({
  open,
  onOpenChange,
  currentPlan,
  periodEnd,
  onSuccess,
}: CancelSubscriptionModalProps) {
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')

  const formattedDate = periodEnd
    ? format(new Date(periodEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const result = await cancelSubscription(reason || undefined)

      if (result.success) {
        toast.success('Assinatura cancelada', {
          description: formattedDate
            ? `Seu acesso continua até ${formattedDate}`
            : 'Sua assinatura foi cancelada',
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error('Erro ao cancelar assinatura', {
          description: result.message,
        })
      }
    } catch (error) {
      toast.error('Erro inesperado', {
        description: 'Tente novamente mais tarde',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-full">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>Cancelar assinatura</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Tem certeza que deseja cancelar seu plano <strong>{currentPlan}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info box */}
          {formattedDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">
                    Seu acesso continua até:
                  </p>
                  <p className="text-blue-700 text-lg font-semibold">{formattedDate}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Após essa data, você volta para o plano Free.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">No plano Free você terá:</p>
                <ul className="mt-1 space-y-1">
                  <li>• 1 fornecedor</li>
                  <li>• 30 vendas por mês</li>
                  <li>• Histórico de 30 dias</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="cancel-reason" className="text-sm text-muted-foreground">
              Pode nos contar por que está cancelando? (opcional)
            </Label>
            <Textarea
              id="cancel-reason"
              placeholder="Seu feedback nos ajuda a melhorar..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Manter assinatura
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? 'Processando...' : 'Confirmar cancelamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
