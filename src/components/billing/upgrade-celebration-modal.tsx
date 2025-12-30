'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Rocket, CheckCircle2, Star, ArrowRight } from 'lucide-react'
import confetti from 'canvas-confetti'
import { markPlanAsNotifiedAction, type Subscription } from '@/app/actions/billing'
import { useRouter } from 'next/navigation'

interface UpgradeCelebrationModalProps {
  subscription: Subscription | null
}

export function UpgradeCelebrationModal({ subscription }: UpgradeCelebrationModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Só abre se estiver ativo e o plano atual for diferente do notificado
    if (
      subscription && 
      subscription.status === 'active' && 
      subscription.plan_id !== subscription.notified_plan_id
    ) {
      setIsOpen(true)
      
      // Lança confetes!
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          clearInterval(interval)
          return
        }

        const particleCount = 50 * (timeLeft / duration)
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
      }, 250)
    }
  }, [subscription])

  const handleClose = async () => {
    setIsUpdating(true)
    try {
      await markPlanAsNotifiedAction()
      setIsOpen(false)
      // Força um recarregamento total da página para limpar banners e estados globais
      window.location.href = '/'
    } catch (error) {
      console.error('Erro ao marcar plano como notificado:', error)
      setIsOpen(false)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!subscription) return null

  const isFirstSubscription = !subscription.notified_plan_id
  const planName = subscription.plan_snapshot.name || 'Premium'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isUpdating && setIsOpen(open)}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 p-8 text-white relative overflow-hidden border-b border-white/5">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-xl mb-6 shadow-inner border border-white/10 animate-bounce">
              <Rocket className="w-12 h-12 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            </div>
            <DialogTitle className="text-3xl md:text-4xl font-bold mb-2 tracking-tight text-white">
              {isFirstSubscription ? 'Bem-vindo ao Time!' : 'Upgrade Concluído!'}
            </DialogTitle>
            <p className="text-blue-200 font-medium text-lg">
              {isFirstSubscription 
                ? `Você agora é um assinante ${planName}!` 
                : `Sua conta foi elevada para o nível ${planName}!`}
            </p>
          </div>
        </div>

        <div className="p-8 bg-background">
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Recursos Desbloqueados:</h4>
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Vendas p/ Mês</p>
                    <p className="text-xs text-muted-foreground">
                      {subscription.plan_snapshot.max_sales_month >= 9999 ? 'Ilimitado' : `Até ${subscription.plan_snapshot.max_sales_month} vendas`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Pastas de Organização</p>
                    <p className="text-xs text-muted-foreground">
                      {subscription.plan_snapshot.max_suppliers >= 9999 ? 'Ilimitado' : `Até ${subscription.plan_snapshot.max_suppliers} pastas`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground italic">
              &quot;Agora você tem o poder total para escalar suas comissões com controle absoluto.&quot;
            </p>
          </div>

          <DialogFooter className="mt-8">
            <Button 
              onClick={handleClose} 
              className="w-full h-12 text-base font-bold gap-2 group" 
              disabled={isUpdating}
            >
              {isUpdating ? 'Processando...' : 'Vamos Começar!'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

