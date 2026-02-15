'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AlertCircle, Lock, X } from 'lucide-react'
import { useCurrentUser } from '@/contexts/current-user-context'
import { useBillingData } from './billing-notification-provider'

const APPEAR_DELAY_MS = 2000
const ANIMATION_DURATION_MS = 400
const STORAGE_KEY_SHOWN = 'trial-banner-last-shown'
const STORAGE_KEY_DISMISSED = 'trial-banner-dismissed-at'
const DISMISS_COOLDOWN_MS = 48 * 60 * 60 * 1000 // 48h

function shouldShowBanner(daysRemaining: number): boolean {
  // Mais de 5 dias: nunca mostra banner
  if (daysRemaining > 5) return false

  // 48h ou menos (2 dias): sempre mostra (se não foi dismissed)
  if (daysRemaining <= 2) return true

  // 3-5 dias: mostra 1x por dia
  try {
    const lastShown = localStorage.getItem(STORAGE_KEY_SHOWN)
    if (!lastShown) return true

    const lastDate = new Date(lastShown).toDateString()
    const today = new Date().toDateString()
    return lastDate !== today
  } catch {
    return true
  }
}

function isDismissed(): boolean {
  try {
    const dismissedAt = localStorage.getItem(STORAGE_KEY_DISMISSED)
    if (!dismissedAt) return false

    const elapsed = Date.now() - new Date(dismissedAt).getTime()
    return elapsed < DISMISS_COOLDOWN_MS
  } catch {
    return false
  }
}

function markBannerShown() {
  try {
    localStorage.setItem(STORAGE_KEY_SHOWN, new Date().toISOString())
  } catch {
    // localStorage indisponível
  }
}

function markBannerDismissed() {
  try {
    localStorage.setItem(STORAGE_KEY_DISMISSED, new Date().toISOString())
  } catch {
    // localStorage indisponível
  }
}

type BannerVariant = 'expired-blocked' | 'expired' | 'urgent' | 'warning' | 'info' | null

export function TrialBanner() {
  const router = useRouter()
  const pathname = usePathname()
  const { currentUser } = useCurrentUser()
  const { blockedCount } = useBillingData()
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [bannerHeight, setBannerHeight] = useState<number | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [variant, setVariant] = useState<BannerVariant>(null)
  const [daysLeft, setDaysLeft] = useState(0)

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
    const days = Math.max(0, billing.trial.daysRemaining ?? 0)

    setDaysLeft(days)

    // Trial expirado
    if (trialExpired) {
      // Respeitar dismiss de 48h
      if (isDismissed()) {
        setShouldRender(false)
        return
      }

      setVariant(blockedCount > 0 ? 'expired-blocked' : 'expired')
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
      if (!shouldShowBanner(days) || isDismissed()) {
        setShouldRender(false)
        return
      }

      markBannerShown()

      if (days <= 2) {
        setVariant('urgent')
      } else if (days <= 5) {
        setVariant('warning')
      } else {
        setVariant('info')
      }

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
  }, [currentUser, pathname, blockedCount])

  // Recalcular variant quando blockedCount mudar (carrega async)
  useEffect(() => {
    if (variant === 'expired' && blockedCount > 0) {
      setVariant('expired-blocked')
    } else if (variant === 'expired-blocked' && blockedCount === 0) {
      setVariant('expired')
    }
  }, [blockedCount, variant])

  const getBannerStyles = (): string => {
    switch (variant) {
      case 'expired-blocked':
      case 'expired':
        return 'bg-orange-500 text-white'
      case 'urgent':
        return 'bg-amber-500 text-white'
      case 'warning':
        return 'bg-amber-600 text-white'
      case 'info':
        return 'bg-primary text-primary-foreground'
      default:
        return 'bg-primary text-primary-foreground'
    }
  }

  const getIcon = () => {
    if (variant === 'expired-blocked') {
      return <Lock className="h-4 w-4 shrink-0" />
    }
    return <AlertCircle className="h-4 w-4 shrink-0" />
  }

  const getMessage = () => {
    switch (variant) {
      case 'expired-blocked':
        return (
          <>
            Seu teste terminou. Você tem {blockedCount} {blockedCount === 1 ? 'pasta bloqueada' : 'pastas bloqueadas'}.{' '}
            <button
              onClick={() => { handleClose(); router.push('/planos') }}
              className="underline font-bold hover:opacity-80 transition-opacity"
            >
              Faça upgrade
            </button>{' '}
            para acessar todas.
          </>
        )
      case 'expired':
        return (
          <>
            Seu período de teste terminou. Você está no plano FREE com limites reduzidos.{' '}
            <button
              onClick={() => { handleClose(); router.push('/planos') }}
              className="underline hover:opacity-80 transition-opacity"
            >
              Conheça os planos
            </button>.
          </>
        )
      case 'urgent':
        return (
          <>
            Atenção: Seu teste termina em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}! Para manter acesso ilimitado,{' '}
            <button
              onClick={() => { handleClose(); router.push('/planos') }}
              className="underline hover:opacity-80 transition-opacity"
            >
              conheça os planos
            </button>.
          </>
        )
      case 'warning':
        return (
          <>
            Você possui {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'} de teste ULTRA (ilimitado),{' '}
            <button
              onClick={() => { handleClose(); router.push('/planos') }}
              className="underline hover:opacity-80 transition-opacity"
            >
              conheça os planos
            </button>.
          </>
        )
      default:
        return (
          <>
            Você está no plano FREE. Para ter acesso ilimitado e mais recursos,{' '}
            <button
              onClick={() => { handleClose(); router.push('/planos') }}
              className="underline hover:opacity-80 transition-opacity"
            >
              conheça o plano ULTRA
            </button>.
          </>
        )
    }
  }

  const handleClose = () => {
    markBannerDismissed()
    setIsClosing(true)
    setTimeout(() => {
      setIsVisible(false)
      setShouldRender(false)
    }, ANIMATION_DURATION_MS)
  }

  if (!shouldRender) return null

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
      className="w-full z-40 overflow-hidden will-change-[height,opacity,transform] max-h-20"
      style={getContainerStyle()}
    >
      <div
        ref={contentRef}
        className={`py-2 px-4 flex items-center justify-between text-sm font-medium border-b ${getBannerStyles()}`}
      >
        <div className="flex-1 flex items-center justify-center gap-2">
          {getIcon()}
          <span>{getMessage()}</span>
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
