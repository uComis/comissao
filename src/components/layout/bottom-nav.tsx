'use client'

import { LayoutDashboard, ShoppingCart, Plus, Wallet, Settings, Users, Building2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const mainItems = [
  { title: 'Analytics', url: '/home', icon: LayoutDashboard },
  { title: 'Vendas', url: '/minhasvendas', icon: ShoppingCart },
  { title: 'Nova', url: '/minhasvendas/nova', icon: Plus, isAction: true },
  { title: 'Faturamento', url: '/faturamento', icon: Wallet },
]

const gestaoItems = [
  { title: 'Meus Clientes', url: '/clientes', icon: Users },
  { title: 'Minhas Pastas', url: '/fornecedores', icon: Building2 },
]

export function BottomNav() {
  const pathname = usePathname()
  const [gestaoOpen, setGestaoOpen] = useState(false)

  const isGestaoActive = gestaoItems.some(item => pathname === item.url)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex items-center justify-around h-16 px-2 pb-[env(safe-area-inset-bottom)]">
        {mainItems.map((item) => {
          const isActive = pathname === item.url
          const Icon = item.icon

          if (item.isAction) {
            return (
              <Link
                key={item.title}
                href={item.url}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Icon className="h-6 w-6" />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          )
        })}

        {/* Gestão com Popover */}
        <Popover open={gestaoOpen} onOpenChange={setGestaoOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                isGestaoActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Settings className="h-5 w-5" />
              <span className="text-[10px] font-medium">Gestão</span>
            </button>
          </PopoverTrigger>
          <PopoverContent 
            side="top" 
            align="end" 
            className="w-48 p-2"
            sideOffset={8}
          >
            <div className="flex flex-col gap-1">
              {gestaoItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.url
                return (
                  <Link
                    key={item.title}
                    href={item.url}
                    onClick={() => setGestaoOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
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
    </nav>
  )
}

