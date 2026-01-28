'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle, Clock, CreditCard } from 'lucide-react'
import { useCurrentUser } from '@/contexts/current-user-context'
import { Button } from '@/components/ui/button'

/**
 * Banner de alerta de renovação
 * Aparece 3 dias antes do vencimento (warning)
 * Aparece 1 dia antes do vencimento (urgent)
 */
export function RenewalAlert() {
  const router = useRouter()
  const { currentUser } = useCurrentUser()

  const renewalAlert = currentUser?.billing?.renewalAlert

  // Não renderiza se não precisa alertar
  if (!renewalAlert?.needsAlert) return null

  const isUrgent = renewalAlert.urgencyLevel === 'urgent'
  const daysText = renewalAlert.daysRemaining === 1 ? 'amanhã' : `em ${renewalAlert.daysRemaining} dias`

  return (
    <div className="w-full z-30">
      <div className={`
        py-3 px-4 flex items-center justify-between text-sm font-medium
        ${isUrgent 
          ? 'bg-red-600 text-white' 
          : 'bg-amber-500 text-white'}
        animate-in slide-in-from-top duration-500
      `}>
        <div className="flex-1 flex items-center justify-center gap-2">
          {isUrgent ? (
            <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
          ) : (
            <Clock className="h-4 w-4 shrink-0" />
          )}
          <span>
            {isUrgent 
              ? `⚠️ Seu plano vence ${daysText}! Renove agora para não perder o acesso.`
              : `Seu plano vence ${daysText}. Não se esqueça de renovar!`
            }
          </span>
        </div>
        <Button
          size="sm"
          variant={isUrgent ? 'secondary' : 'outline'}
          className={`ml-4 h-7 ${isUrgent ? 'bg-white text-red-600 hover:bg-white/90' : 'border-white text-white hover:bg-white/10'}`}
          onClick={() => router.push('/cobrancas')}
        >
          <CreditCard className="h-3 w-3 mr-1" />
          Renovar Agora
        </Button>
      </div>
    </div>
  )
}
