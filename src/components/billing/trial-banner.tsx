'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AlertCircle, X } from 'lucide-react'
import { useCurrentUser } from '@/contexts/current-user-context'

const TRIAL_BANNER_CLOSED_KEY = 'trial_banner_closed'

export function TrialBanner() {
  const router = useRouter()
  const pathname = usePathname()
  const { currentUser } = useCurrentUser()
  const [isVisible, setIsVisible] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [trialData, setTrialData] = useState<{
    daysLeft: number
    isTrial: boolean
  } | null>(null)

  useEffect(() => {
    // Verificar se foi fechado antes
    const wasClosed = localStorage.getItem(TRIAL_BANNER_CLOSED_KEY) === 'true'
    if (wasClosed) {
      setIsVisible(false)
      return
    }

    // Se não tem dados do usuário, não faz nada
    if (!currentUser?.billing) {
      return
    }

    // Reset estados de animação ao montar
    setIsAnimating(false)
    setShouldRender(false)

    const billing = currentUser.billing
    const isFree = billing.effectivePlan === 'free'
    const isUltra = billing.effectivePlan === 'ultra'
    const hasPaidSub = billing.isInTrial && !!billing.asaasSubscriptionId

    if ((isFree || isUltra) && !hasPaidSub) {
      const daysLeft = billing.trial.daysRemaining ?? 0
      setTrialData({
        daysLeft: Math.max(0, daysLeft),
        isTrial: isUltra
      })
      setShouldRender(true)
      // Trigger slide down animation após um pequeno delay para garantir que o DOM está pronto
      requestAnimationFrame(() => {
        setTimeout(() => setIsAnimating(true), 10)
      })
    } else {
      setShouldRender(false)
    }
  }, [currentUser])

  const getBannerStyles = () => {
    if (trialData && trialData.daysLeft <= 3) return 'bg-amber-600 text-white'
    return 'bg-primary text-primary-foreground'
  }

  const handleClose = () => {
    setIsClosing(true)
    setIsAnimating(false)
    
    setTimeout(() => {
      setIsVisible(false)
      setShouldRender(false)
    }, 300)
  }

    // ✅ Não renderiza nada se não deve mostrar (evita layout shift)
    if (!shouldRender || !isVisible) return null

    const daysLeft = trialData?.daysLeft ?? 0
    const isTrial = trialData?.isTrial ?? false

  return (
    <div 
      className={`
        w-full z-[70]
        overflow-hidden
        transition-all duration-300 ease-out
        ${isAnimating && !isClosing 
          ? 'h-auto opacity-100' 
          : 'h-0 opacity-0'
        }
      `}
    >
      <div className={`py-2 px-4 flex items-center justify-between text-sm font-medium border-b ${getBannerStyles()}`}>
        <div className="flex-1 flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {isTrial ? (
              daysLeft <= 3 
                ? <>Atenção: Seu teste ULTRA termina em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}! Para manter acesso ilimitado, <button onClick={() => router.push('/planos')} className="underline hover:opacity-80 transition-opacity">conheça os planos</button>.</> 
                : <>Você possui {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'} de teste ULTRA (ilimitado), <button onClick={() => router.push('/planos')} className="underline hover:opacity-80 transition-opacity">conheça os planos</button>.</>
            ) : (
              <>Você está no plano FREE. Para ter acesso ilimitado e mais recursos, <button onClick={() => router.push('/planos')} className="underline hover:opacity-80 transition-opacity">conheça o plano ULTRA</button>.</>
            )}
          </span>
        </div>
        <button 
          onClick={handleClose}
          className="hover:opacity-70 shrink-0 ml-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

