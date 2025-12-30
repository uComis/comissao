'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { PlanSelectionDialog } from './plan-selection-dialog'
import { getBillingUsage } from '@/app/actions/billing'
import { differenceInDays, parseISO } from 'date-fns'

export function TrialBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimated, setIsAnimated] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [trialData, setTrialData] = useState<{
    daysLeft: number
    isTrial: boolean
  } | null>(null)

  useEffect(() => {
    async function loadTrial() {
      try {
        const data = await getBillingUsage()
        if (data && data.status === 'trialing' && data.trialEndsAt) {
          const daysLeft = differenceInDays(parseISO(data.trialEndsAt), new Date())
          setTrialData({
            daysLeft: Math.max(0, daysLeft),
            isTrial: true
          })
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

  // Dispara a animação após o carregamento quando há dados de trial
  useEffect(() => {
    if (!loading && trialData?.isTrial && isVisible) {
      // Delay de 2 segundos para o usuário se situar na página primeiro
      const timer = setTimeout(() => setIsAnimated(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [loading, trialData?.isTrial, isVisible])

  const getBannerStyles = () => {
    if (trialData && trialData.daysLeft <= 3) return 'bg-amber-600 text-white'
    return 'bg-primary text-primary-foreground'
  }

  // Não renderiza se estiver carregando ou se não for trial
  if (loading || !trialData?.isTrial) return null

  // Se o usuário fechou, anima para fora
  if (!isVisible) return null

  const daysLeft = trialData.daysLeft

  return (
    <>
      <div 
        className={`
          w-full overflow-hidden transition-all ease-out z-50
          fixed top-0 left-0 right-0 md:relative md:top-auto md:left-auto md:right-auto
          ${isClosing ? 'duration-[1000ms]' : 'duration-[2000ms]'}
          ${isAnimated ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className={`py-2 px-4 flex items-center justify-between text-sm font-medium ${getBannerStyles()}`}>
          <div className="flex-1 flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {daysLeft <= 3 
                ? <>Atenção: Seu teste termina em {daysLeft} dias! Para manter seu acesso, <button onClick={() => setIsPlanModalOpen(true)} className="underline hover:opacity-80 transition-opacity">conheça os planos</button>.</> 
                : <>Você possui {daysLeft} dias de teste full, <button onClick={() => setIsPlanModalOpen(true)} className="underline hover:opacity-80 transition-opacity">conheça os planos</button>.</>}
            </span>
          </div>
          <button 
            onClick={() => {
              setIsClosing(true)
              setIsAnimated(false)
              setTimeout(() => setIsVisible(false), 1000)
            }} 
            className="hover:opacity-70 shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <PlanSelectionDialog 
        open={isPlanModalOpen} 
        onOpenChange={setIsPlanModalOpen} 
      />
    </>
  )
}

