'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, X } from 'lucide-react'
import { getBillingUsage } from '@/app/actions/billing'
import { differenceInDays, parseISO } from 'date-fns'

export function TrialBanner() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [trialData, setTrialData] = useState<{
    daysLeft: number
    isTrial: boolean
  } | null>(null)

  useEffect(() => {
    async function loadTrial() {
      try {
        const data = await getBillingUsage()
        // Só mostra banner se está em trial (não mostra se já assinou algum plano pago)
        if (data && data.status === 'trialing' && data.trialEndsAt) {
          const daysLeft = differenceInDays(parseISO(data.trialEndsAt), new Date())
          setTrialData({
            daysLeft: Math.max(0, daysLeft),
            isTrial: true
          })
          // Trigger entrance animation after data loads
          setTimeout(() => setIsAnimating(true), 10)
        } else {
          setTrialData({ daysLeft: 0, isTrial: false })
        }
      } catch (error) {
        console.error('Error loading trial data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadTrial()
  }, [])

  const getBannerStyles = () => {
    if (trialData && trialData.daysLeft <= 3) return 'bg-amber-600 text-white'
    return 'bg-primary text-primary-foreground'
  }

  // Não renderiza se estiver carregando ou se não for trial
  if (loading || !trialData?.isTrial) return null

  // Se o usuário fechou, não renderiza
  if (!isVisible) return null

  const daysLeft = trialData.daysLeft

  return (
    <>
      <div 
        className={`
          w-full z-50
          transition-all duration-500 ease-out
          ${isClosing 
            ? 'max-h-0 opacity-0 overflow-hidden' 
            : isAnimating 
              ? 'translate-y-0 opacity-100' 
              : '-translate-y-2 opacity-0'}
        `}
      >
        <div className={`py-2 px-4 flex items-center justify-between text-sm font-medium ${getBannerStyles()}`}>
          <div className="flex-1 flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {daysLeft <= 3 
                ? <>Atenção: Seu teste ULTRA termina em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}! Para manter acesso ilimitado, <button onClick={() => router.push('/planos')} className="underline hover:opacity-80 transition-opacity">conheça os planos</button>.</> 
                : <>Você possui {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'} de teste ULTRA (ilimitado), <button onClick={() => router.push('/planos')} className="underline hover:opacity-80 transition-opacity">conheça os planos</button>.</>}
            </span>
          </div>
          <button 
            onClick={() => {
              setIsClosing(true)
              setTimeout(() => setIsVisible(false), 500)
            }} 
            className="hover:opacity-70 shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )
}

