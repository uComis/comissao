'use client'

import { TrendingUp, Receipt, Plus, Wallet, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useEffect, useCallback, useRef, useState } from 'react'
import { usePageHeader, usePageHeaderActions } from './page-header-context'
import { useAiChat } from '@/components/ai-assistant'

type BottomNavPhase = 'visible' | 'hiding' | 'hidden' | 'showing'

const ANIM_DURATION = 250

export function BottomNav() {
  const pathname = usePathname()
  const { isOpen: isAiChatOpen, toggle: toggleAiChat } = useAiChat()
  const { taskMode } = usePageHeader()
  const actions = usePageHeaderActions()
  const [mounted, setMounted] = useState(false)

  // Animation state machine
  const [phase, setPhase] = useState<BottomNavPhase>('hidden')
  const [displayedTaskMode, setDisplayedTaskMode] = useState(taskMode)
  const prevTaskMode = useRef(taskMode)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    setMounted(true)
    // Initial slide-up
    const t = setTimeout(() => setPhase('showing'), 50)
    return () => clearTimeout(t)
  }, [])

  // When showing phase starts, mark visible after animation
  useEffect(() => {
    if (phase === 'showing') {
      timerRef.current = setTimeout(() => setPhase('visible'), ANIM_DURATION)
      return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }
  }, [phase])

  // Detect taskMode change → trigger hide/show cycle
  useEffect(() => {
    if (prevTaskMode.current !== taskMode) {
      prevTaskMode.current = taskMode

      // Start hiding
      setPhase('hiding')

      // After hide animation, swap content and show
      timerRef.current = setTimeout(() => {
        setDisplayedTaskMode(taskMode)
        setPhase('showing')
      }, ANIM_DURATION)

      return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }
  }, [taskMode])

  // Sync displayedTaskMode when no animation needed (initial render, same mode navigation)
  useEffect(() => {
    if (phase === 'visible' || phase === 'hidden') {
      setDisplayedTaskMode(taskMode)
    }
  }, [taskMode, phase])

  const isPathActive = useCallback((url: string) => pathname === url || pathname.startsWith(`${url}/`), [pathname])

  const translateClass = (phase === 'visible' || phase === 'showing')
    ? 'translate-y-0'
    : 'translate-y-full'

  if (displayedTaskMode) {
    return (
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 md:hidden bg-background border-t px-4 py-3 transition-transform ease-out',
          translateClass
        )}
        style={{ transitionDuration: `${ANIM_DURATION}ms` }}
      >
        <div className="grid grid-cols-2 gap-3 [&>*]:w-full [&>a]:w-full [&_a]:w-full [&_button]:w-full">
          {actions}
        </div>
      </div>
    )
  }

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 md:hidden bg-background border-t transition-transform ease-out',
        translateClass
      )}
      style={{ transitionDuration: `${ANIM_DURATION}ms` }}
      aria-label="Navegação inferior"
    >
      <div className="flex h-16 items-center px-2">
        <div className="grid w-full grid-cols-5 items-center">
          <NavItem
            href="/home"
            icon={TrendingUp}
            label="Home"
            isActive={isPathActive('/home')}
          />

          <NavItem
            href="/minhasvendas"
            icon={Receipt}
            label="Vendas"
            isActive={isPathActive('/minhasvendas') && !pathname.includes('/nova') && !pathname.includes('/editar')}
          />

          <NavItem
            href="/minhasvendas/nova"
            icon={Plus}
            label="Nova"
            isActive={pathname === '/minhasvendas/nova'}
          />

          <NavItem
            href="/faturamento"
            icon={Wallet}
            label="Ganhos"
            isActive={isPathActive('/faturamento')}
          />

          <button
            type="button"
            onClick={toggleAiChat}
            className={cn(
              'flex flex-col items-center justify-center gap-1 transition-all active:scale-90',
              isAiChatOpen ? 'text-[#409eff]' : 'text-muted-foreground'
            )}
          >
            <Sparkles className={cn('h-5 w-5', isAiChatOpen && 'stroke-[2.5px]')} />
            <span className="text-[10px] font-bold tracking-tight uppercase opacity-90">Kai</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string
  icon: any
  label: string
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center justify-center gap-1 transition-all active:scale-90',
        isActive ? 'text-[#409eff]' : 'text-muted-foreground'
      )}
    >
      <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
      <span className="text-[10px] font-bold tracking-tight uppercase opacity-90">{label}</span>
    </Link>
  )
}
