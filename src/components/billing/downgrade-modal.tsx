'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, Calendar, ArrowDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { scheduleDowngrade } from '@/app/actions/billing/subscriptions'
import { toast } from 'sonner'

interface DowngradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlan: string
  newPlan: {
    id: string
    name: string
    price: number
    interval: string
    max_suppliers: number
    max_sales_month: number
  }
  periodEnd: string | null
  onSuccess?: () => void
}

export function DowngradeModal({
  open,
  onOpenChange,
  currentPlan,
  newPlan,
  periodEnd,
  onSuccess,
}: DowngradeModalProps) {
  const [loading, setLoading] = useState(false)

  const formattedDate = periodEnd
    ? format(new Date(periodEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : 'fim do período atual'

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const result = await scheduleDowngrade(newPlan.id)

      if (result.success) {
        toast.success('Downgrade agendado com sucesso', {
          description: `Seu plano mudará para ${newPlan.name} em ${formattedDate}`,
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error('Erro ao agendar downgrade', {
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
            <div className="p-2 bg-amber-100 rounded-full">
              <ArrowDown className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle>Mudar para plano inferior</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Você está solicitando a mudança do plano <strong>{currentPlan}</strong> para{' '}
            <strong>{newPlan.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">
                  Seu plano {currentPlan} continua até:
                </p>
                <p className="text-amber-700 text-lg font-semibold">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p>Após essa data, seus novos limites serão:</p>
                <ul className="mt-1 space-y-1">
                  <li>
                    • {newPlan.max_suppliers >= 9999
                      ? 'Fornecedores ilimitados'
                      : `${newPlan.max_suppliers} fornecedor${newPlan.max_suppliers > 1 ? 'es' : ''}`}
                  </li>
                  <li>
                    • {newPlan.max_sales_month >= 99999
                      ? 'Vendas ilimitadas'
                      : `${newPlan.max_sales_month} vendas/mês`}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Você pode cancelar esta mudança a qualquer momento antes da data acima.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Manter plano atual
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? 'Processando...' : 'Confirmar mudança'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
