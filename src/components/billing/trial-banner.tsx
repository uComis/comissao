'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlanSelectionDialog } from './plan-selection-dialog'
import { getBillingUsage } from '@/app/actions/billing'
import { differenceInDays, parseISO } from 'date-fns'

export function TrialBanner() {
  const [isVisible, setIsVisible] = useState(true)
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

  const getBannerStyles = () => {
    if (trialData && trialData.daysLeft <= 3) return 'bg-amber-600 text-white'
    return 'bg-primary text-primary-foreground'
  }

  if (loading || !isVisible || !trialData?.isTrial) return null

  const daysLeft = trialData.daysLeft

  return (
    <>
      <div className={`w-full py-2 px-4 flex items-center justify-between text-sm font-medium transition-all ${getBannerStyles()}`}>
        <div className="flex-1 flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>
            {daysLeft <= 3 
              ? `Atenção: Seu teste grátis termina em ${daysLeft} dias. Assine agora para manter seu acesso total.` 
              : `Você está no período de teste full. Restam ${daysLeft} dias.`}
          </span>
          <button 
            onClick={() => setIsPlanModalOpen(true)}
            className="underline ml-2 hover:opacity-80 transition-opacity"
          >
            Ver Planos
          </button>
        </div>
        <button onClick={() => setIsVisible(false)} className="hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      </div>

      <PlanSelectionDialog 
        open={isPlanModalOpen} 
        onOpenChange={setIsPlanModalOpen} 
      />
    </>
  )
}

