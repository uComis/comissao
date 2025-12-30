'use client'

import { TrendingUp, Receipt, Plus, Wallet, FolderOpen, Users, Building2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const gestaoItems = [
  { title: 'Meus Clientes', url: '/clientes', icon: Users },
  { title: 'Minhas Pastas', url: '/fornecedores', icon: Building2 },
]

export function BottomNav() {
  const pathname = usePathname()
  const [gestaoOpen, setGestaoOpen] = useState(false)

  const isPathActive = (url: string) => pathname === url || pathname.startsWith(`${url}/`)
  const isGestaoActive = gestaoItems.some(item => isPathActive(item.url))

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 w-full border-t border-border/50 bg-background/95 backdrop-blur-md md:hidden"
      aria-label="Navegação inferior"
    >
      <div className="flex h-[calc(64px+env(safe-area-inset-bottom))] items-center px-4 pb-[env(safe-area-inset-bottom)]">
        <div className="grid w-full grid-cols-5 items-center">
          {/* Analytics */}
          <NavItem
            href="/home"
            icon={TrendingUp}
            label="Analytics"
            isActive={isPathActive('/home')}
          />

          {/* Extrato */}
          <NavItem
            href="/minhasvendas"
            icon={Receipt}
            label="Extrato"
            isActive={isPathActive('/minhasvendas')}
          />

          {/* Botão Central (Nova) */}
          <div className="relative flex justify-center">
            <Link
              href="/minhasvendas/nova"
              className="absolute -top-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform active:scale-95"
            >
              <Plus className="h-8 w-8" strokeWidth={3} />
            </Link>
          </div>

          {/* Recebíveis */}
          <NavItem
            href="/faturamento"
            icon={Wallet}
            label="Recebíveis"
            isActive={isPathActive('/faturamento')}
          />

          {/* Cadastros (Popover) */}
          <Popover open={gestaoOpen} onOpenChange={setGestaoOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex flex-col items-center justify-center gap-1 transition-colors active:scale-95',
                  isGestaoActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <FolderOpen className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-none">Cadastros</span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              className="w-56 p-2 mb-4"
              sideOffset={12}
            >
              <div className="flex flex-col gap-1">
                {gestaoItems.map((item) => {
                  const Icon = item.icon
                  const isActive = isPathActive(item.url)
                  return (
                    <Link
                      key={item.title}
                      href={item.url}
                      onClick={() => setGestaoOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                        isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  )
                })}
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
        'flex flex-col items-center justify-center gap-1 transition-colors active:scale-95',
        isActive ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </Link>
  )
}

