'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, X } from 'lucide-react'
import { getBlockedSuppliers } from '@/app/actions/billing'

export function BlockedSuppliersBanner() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [blockedCount, setBlockedCount] = useState(0)

  useEffect(() => {
    async function loadBlockedSuppliers() {
      try {
        const data = await getBlockedSuppliers()
        setBlockedCount(data.blockedCount)
      } catch (error) {
        console.error('Error loading blocked suppliers:', error)
      } finally {
        setLoading(false)
      }
    }
    loadBlockedSuppliers()
  }, [])

  // Não renderiza se estiver carregando ou se não houver pastas bloqueadas
  if (loading || blockedCount === 0) return null

  // Se o usuário fechou, não renderiza
  if (!isVisible) return null

  return (
    <>
      <div 
        className={`
          w-full z-40
          ${isClosing ? 'max-h-0 opacity-0 overflow-hidden transition-all duration-500' : ''}
        `}
      >
        <div className="py-2 px-4 flex items-center justify-between text-sm font-medium bg-orange-500 text-white">
          <div className="flex-1 flex items-center justify-center gap-2">
            <Lock className="h-4 w-4 shrink-0" />
            <span>
              Você tem {blockedCount} {blockedCount === 1 ? 'pasta bloqueada' : 'pastas bloqueadas'}. <button onClick={() => router.push('/planos')} className="underline hover:opacity-80 transition-opacity font-bold">Faça upgrade</button> para acessar todas.
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
