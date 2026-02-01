'use client'

import { TrendingUp, Receipt, Plus, Wallet, FolderOpen, Users, Building2, Moon, Sun } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useState, useEffect, useCallback, useRef } from 'react'
import { usePageHeader, usePageHeaderActions } from './page-header-context'

const gestaoItems = [
  { title: 'Meus Clientes', url: '/clientes', icon: Users },
  { title: 'Minhas Pastas', url: '/fornecedores', icon: Building2 },
]

type BottomNavPhase = 'visible' | 'hiding' | 'hidden' | 'showing'

const ANIM_DURATION = 250

export function BottomNav() {
  const pathname = usePathname()
  const [gestaoOpen, setGestaoOpen] = useState(false)
  const { taskMode } = usePageHeader()
  const actions = usePageHeaderActions()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Animation state machine
  const [phase, setPhase] = useState<BottomNavPhase>('hidden')
  const [displayedTaskMode, setDisplayedTaskMode] = useState(taskMode)
  const prevTaskMode = useRef(taskMode)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

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
      return () => clearTimeout(timerRef.current)
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

      return () => clearTimeout(timerRef.current)
    }
  }, [taskMode])

  // Sync displayedTaskMode when no animation needed (initial render, same mode navigation)
  useEffect(() => {
    if (phase === 'visible' || phase === 'hidden') {
      setDisplayedTaskMode(taskMode)
    }
  }, [taskMode, phase])

  const isPathActive = useCallback((url: string) => pathname === url || pathname.startsWith(`${url}/`), [pathname])
  const isGestaoActive = gestaoItems.some(item => isPathActive(item.url))
  const isDark = mounted && resolvedTheme === 'dark'

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
        <div className="flex items-center justify-end gap-3">
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

          {/* Menu com Popover */}
          <Popover open={gestaoOpen} onOpenChange={setGestaoOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex flex-col items-center justify-center gap-1 transition-all active:scale-90',
                  isGestaoActive ? 'text-[#409eff]' : 'text-muted-foreground'
                )}
              >
                <FolderOpen className={cn('h-5 w-5', isGestaoActive && 'stroke-[2.5px]')} />
                <span className="text-[10px] font-bold tracking-tight uppercase opacity-90">Menu</span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              className="w-52 p-1.5 mb-2 rounded-2xl bg-secondary/95 backdrop-blur-xl border-border/40 shadow-2xl"
              sideOffset={8}
            >
              <div className="flex flex-col gap-0.5">
                {gestaoItems.map((item) => {
                  const Icon = item.icon
                  const isActive = isPathActive(item.url)
                  return (
                    <Link
                      key={item.title}
                      href={item.url}
                      onClick={() => setGestaoOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                        isActive ? 'bg-[#409eff]/10 text-[#409eff]' : 'hover:bg-muted'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  )
                })}

                {/* Separador */}
                <div className="mx-2 my-1 border-t border-border/40" />

                {/* Toggle tema */}
                {mounted && (
                  <button
                    type="button"
                    onClick={() => {
                      setTheme(isDark ? 'light' : 'dark')
                      setGestaoOpen(false)
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted"
                  >
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    <span className="text-sm font-medium">
                      {isDark ? 'Modo claro' : 'Modo escuro'}
                    </span>
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>
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
