'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AlertCircle, X } from 'lucide-react'
import { useCurrentUser } from '@/contexts/current-user-context'

const APPEAR_DELAY_MS = 2000
const ANIMATION_DURATION_MS = 400
const STORAGE_KEY = 'trial-banner-last-shown'

function shouldShowBanner(daysRemaining: number): boolean {
  // Mais de 5 dias: nunca mostra banner
  if (daysRemaining > 5) return false

  // 48h ou menos (2 dias): sempre mostra
  if (daysRemaining <= 2) return true

  // 3-5 dias: mostra 1x por dia
  try {
    const lastShown = localStorage.getItem(STORAGE_KEY)
    if (!lastShown) return true

    const lastDate = new Date(lastShown).toDateString()
    const today = new Date().toDateString()
    return lastDate !== today
  } catch {
    return true
  }
}

function markBannerShown() {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString())
  } catch {
    // localStorage indisponível
  }
}

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
    isExpired: boolean
  } | null>(null)

  useEffect(() => {
    if (!currentUser?.billing || pathname === '/planos') {
      setShouldRender(false)
      return
    }

    const billing = currentUser.billing
    const isInTrial = billing.isInTrial
    const isPaidUp = billing.isPaidUp
    const hasPaidSub = isInTrial && !!billing.asaasSubscriptionId
    const trialExpired = !isInTrial && !isPaidUp && !hasPaidSub
    const daysLeft = Math.max(0, billing.trial.daysRemaining ?? 0)

    // Trial expirado: banner fixo sem X
    if (trialExpired) {
      setTrialData({ daysLeft: 0, isTrial: false, isExpired: true })
      setShouldRender(true)

      setTimeout(() => {
        if (contentRef.current) {
          setBannerHeight(contentRef.current.scrollHeight)
        }
      }, 10)

      const appearTimer = setTimeout(() => {
        setIsVisible(true)
      }, APPEAR_DELAY_MS)

      return () => clearTimeout(appearTimer)
    }

    // Trial ativo: verifica se deve mostrar
    if (isInTrial && !hasPaidSub) {
      if (!shouldShowBanner(daysLeft)) {
        setShouldRender(false)
        return
      }

      markBannerShown()
      setTrialData({ daysLeft, isTrial: true, isExpired: false })
      setShouldRender(true)

      setTimeout(() => {
        if (contentRef.current) {
          setBannerHeight(contentRef.current.scrollHeight)
        }
      }, 10)

      const appearTimer = setTimeout(() => {
        setIsVisible(true)
      }, APPEAR_DELAY_MS)

      return () => clearTimeout(appearTimer)
    }

    // Pago ou com assinatura ativa: não mostra
    setShouldRender(false)
    setIsVisible(false)
  }, [currentUser, pathname])

  const getBannerStyles = () => {
    if (trialData?.isExpired) return 'bg-destructive text-destructive-foreground'
    if (trialData && trialData.daysLeft <= 3) return 'bg-amber-600 text-white'
    return 'bg-primary text-primary-foreground'
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsVisible(false)
      setShouldRender(false)
    }, ANIMATION_DURATION_MS)
  }

  if (!shouldRender) return null

  const daysLeft = trialData?.daysLeft ?? 0
  const isTrial = trialData?.isTrial ?? false
  const isExpired = trialData?.isExpired ?? false

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
      className="w-full z-40 overflow-hidden will-change-[height,opacity,transform]"
      style={getContainerStyle()}
    >
      <div
        ref={contentRef}
        className={`py-2 px-4 flex items-center justify-between text-sm font-medium border-b ${getBannerStyles()}`}
      >
        <div className="flex-1 flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {isExpired ? (
              <>Seu período de teste terminou. Você está no plano FREE com limites reduzidos. <button onClick={() => { handleClose(); router.push('/planos'); }} className="underline hover:opacity-80 transition-opacity">Conheça os planos</button>.</>
            ) : isTrial ? (
              daysLeft <= 3
                ? <>Atenção: Seu teste ULTRA termina em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}! Para manter acesso ilimitado, <button onClick={() => { handleClose(); router.push('/planos'); }} className="underline hover:opacity-80 transition-opacity">conheça os planos</button>.</>
                : <>Você possui {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'} de teste ULTRA (ilimitado), <button onClick={() => { handleClose(); router.push('/planos'); }} className="underline hover:opacity-80 transition-opacity">conheça os planos</button>.</>
            ) : (
              <>Você está no plano FREE. Para ter acesso ilimitado e mais recursos, <button onClick={() => { handleClose(); router.push('/planos'); }} className="underline hover:opacity-80 transition-opacity">conheça o plano ULTRA</button>.</>
            )}
          </span>
        </div>
        {/* Expirado: sem botão X */}
        {!isExpired && (
          <button
            onClick={handleClose}
            className="hover:opacity-70 shrink-0 ml-2 transition-opacity"
            aria-label="Fechar banner"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
