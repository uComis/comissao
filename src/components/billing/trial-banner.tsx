'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AlertCircle, X } from 'lucide-react'
import { useCurrentUser } from '@/contexts/current-user-context'

const APPEAR_DELAY_MS = 2000 // 2 segundos
const ANIMATION_DURATION_MS = 400 // Duração suave da animação

export function TrialBanner() {
  const router = useRouter()
  const pathname = usePathname()
  const { currentUser } = useCurrentUser()
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [bannerHeight, setBannerHeight] = useState<number | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [trialData, setTrialData] = useState<{
    daysLeft: number
    isTrial: boolean
  } | null>(null)

  useEffect(() => {
    // Se não tem dados do usuário ou se estiver na página de planos, não renderiza
    if (!currentUser?.billing || pathname === '/planos') {
      setShouldRender(false)
      return
    }

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
      
      // Medir altura do banner após renderizar
      setTimeout(() => {
        if (contentRef.current) {
          setBannerHeight(contentRef.current.scrollHeight)
        }
      }, 10)
      
      // Delay de 2 segundos antes de aparecer
      const appearTimer = setTimeout(() => {
        setIsVisible(true)
      }, APPEAR_DELAY_MS)

      return () => {
        clearTimeout(appearTimer)
      }
    } else {
      setShouldRender(false)
      setIsVisible(false)
    }
  }, [currentUser])

  const getBannerStyles = () => {
    if (trialData && trialData.daysLeft <= 3) return 'bg-amber-600 text-white'
    return 'bg-primary text-primary-foreground'
  }

  const handleClose = () => {
    setIsClosing(true)
    
    // Aguarda a animação de slide-up terminar antes de remover do DOM
    setTimeout(() => {
      setIsVisible(false)
      setShouldRender(false)
    }, ANIMATION_DURATION_MS)
  }

  // ✅ Não renderiza nada se não deve mostrar (evita layout shift)
  if (!shouldRender) return null

  const daysLeft = trialData?.daysLeft ?? 0
  const isTrial = trialData?.isTrial ?? false

  const getContainerStyle = () => {
    if (!bannerHeight) {
      return {
        height: '0',
        opacity: '0',
        transform: 'translateY(-100%)',
      }
    }

    if (isVisible && !isClosing) {
      return {
        height: `${bannerHeight}px`,
        opacity: '1',
        transform: 'translateY(0)',
        transition: 'height 400ms ease-out, opacity 400ms ease-out, transform 400ms ease-out',
      }
    }

    if (isClosing) {
      return {
        height: '0',
        opacity: '0',
        transform: 'translateY(-100%)',
        transition: 'height 400ms ease-in, opacity 400ms ease-in, transform 400ms ease-in',
      }
    }

    return {
      height: '0',
      opacity: '0',
      transform: 'translateY(-100%)',
    }
  }

  return (
    <div 
      className="w-full z-[70] overflow-hidden will-change-[height,opacity,transform]"
      style={getContainerStyle()}
    >
      <div 
        ref={contentRef}
        className={`py-2 px-4 flex items-center justify-between text-sm font-medium border-b ${getBannerStyles()}`}
      >
        <div className="flex-1 flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {isTrial ? (
              daysLeft <= 3 
                ? <>Atenção: Seu teste ULTRA termina em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}! Para manter acesso ilimitado, <button onClick={() => { handleClose(); router.push('/planos'); }} className="underline hover:opacity-80 transition-opacity">conheça os planos</button>.</> 
                : <>Você possui {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'} de teste ULTRA (ilimitado), <button onClick={() => { handleClose(); router.push('/planos'); }} className="underline hover:opacity-80 transition-opacity">conheça os planos</button>.</>
            ) : (
              <>Você está no plano FREE. Para ter acesso ilimitado e mais recursos, <button onClick={() => { handleClose(); router.push('/planos'); }} className="underline hover:opacity-80 transition-opacity">conheça o plano ULTRA</button>.</>
            )}
          </span>
        </div>
        <button 
          onClick={handleClose}
          className="hover:opacity-70 shrink-0 ml-2 transition-opacity"
          aria-label="Fechar banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

