'use client'

import { LayoutDashboard, ShoppingCart, ReceiptText, Wallet, Settings, Users, Building2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const mainItems = [
  { title: 'Analytics', url: '/home', icon: LayoutDashboard },
  { title: 'Vendas', url: '/minhasvendas', icon: ShoppingCart },
  { title: 'Nova', url: '/minhasvendas/nova', icon: ReceiptText, isAction: true },
  { title: 'Faturamento', url: '/faturamento', icon: Wallet },
]

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
      className="fixed inset-x-0 bottom-0 z-50 md:hidden pb-[calc(env(safe-area-inset-bottom)+12px)]"
      aria-label="Navegação inferior"
    >
      <div className="mx-auto w-full max-w-md px-4">
        <div className="relative h-[84px] rounded-3xl border border-border/60 bg-background/80 shadow-lg shadow-black/5 backdrop-blur-xl">
          <div className="grid h-full grid-cols-5 items-center px-2">
            {mainItems.map((item) => {
              const Icon = item.icon

              if (item.isAction) {
                return (
                  <div key={item.title} className="relative flex h-full items-center justify-center">
                    <Link
                      href={item.url}
                      aria-label="Nova venda"
                      className="group absolute -top-8 left-1/2 -translate-x-1/2"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/25 ring-4 ring-background transition-transform duration-150 active:scale-95 group-hover:brightness-105">
                        <Icon className="h-7 w-7" />
                      </div>
                    </Link>
                  </div>
                )
              }

              const isActive = isPathActive(item.url)

              return (
                <Link
                  key={item.title}
                  href={item.url}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex h-full flex-col items-center justify-center gap-1 px-1 transition-colors',
                    'active:scale-[0.98]'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-2xl transition-colors',
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span
                    className={cn(
                      'text-[12px] leading-none',
                      isActive ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
              )
            })}

            {/* Gestão com Popover */}
            <Popover open={gestaoOpen} onOpenChange={setGestaoOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Gestão"
                  aria-expanded={gestaoOpen}
                  className="flex h-full flex-col items-center justify-center gap-1 px-1 transition-colors active:scale-[0.98]"
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-2xl transition-colors',
                      isGestaoActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    )}
                  >
                    <Settings className="h-6 w-6" />
                  </span>
                  <span
                    className={cn(
                      'text-[12px] leading-none',
                      isGestaoActive ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
                    )}
                  >
                    Gestão
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                className="w-56 p-2"
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
                        <span
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg',
                            isActive ? 'bg-primary/10' : 'bg-muted/50'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium">{item.title}</span>
                      </Link>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </nav>
  )
}

