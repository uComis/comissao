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
      className="fixed inset-x-0 bottom-6 z-50 flex justify-center md:hidden pointer-events-none"
      aria-label="Navegação inferior"
    >
      <div className="relative flex h-16 w-[92%] max-w-[420px] items-center pointer-events-auto">
        {/* Camada de fundo com SVG para o recorte orgânico (efeito concave) */}
        <div className="absolute inset-0 -z-10">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 320 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-full drop-shadow-[0_-4px_12px_rgba(0,0,0,0.1)]"
            preserveAspectRatio="none"
          >
            <path
              d="M320 20C320 8.95431 311.046 0 300 0H192.4C190.2 0 188.1 0.8 186.4 2.2C179.4 8.2 170.4 12 160 12C149.6 12 140.6 8.2 133.6 2.2C131.9 0.8 129.8 0 127.6 0H20C8.95431 0 0 8.95431 0 20V44C0 55.0457 8.95431 64 20 64H300C311.046 64 320 55.0457 320 44V20Z"
              className="fill-secondary/90 backdrop-blur-xl"
            />
          </svg>
        </div>

        <div className="grid w-full grid-cols-5 items-center px-1">
          {/* Analytics */}
          <NavItem
            href="/home"
            icon={TrendingUp}
            label="Home"
            isActive={isPathActive('/home')}
          />

          {/* Extrato */}
          <NavItem
            href="/minhasvendas"
            icon={Receipt}
            label="Vendas"
            isActive={isPathActive('/minhasvendas')}
          />

          {/* Botão Central (Nova) - Posicionado no recorte do SVG */}
          <div className="relative flex justify-center -mt-6">
            <Link
              href="/minhasvendas/nova"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#409eff] text-white shadow-[0_4px_20px_rgba(64,158,255,0.4)] ring-4 ring-background transition-transform active:scale-90"
            >
              <Plus className="h-8 w-8" strokeWidth={3} />
            </Link>
          </div>

          {/* Recebíveis */}
          <NavItem
            href="/faturamento"
            icon={Wallet}
            label="Ganhos"
            isActive={isPathActive('/faturamento')}
          />

          {/* Cadastros com Popover */}
          <Popover open={gestaoOpen} onOpenChange={setGestaoOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex flex-col items-center justify-center gap-1 transition-all active:scale-90',
                  isGestaoActive ? 'text-[#409eff]' : 'text-muted-foreground'
                )}
              >
                <FolderOpen className={cn("h-5 w-5", isGestaoActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-bold tracking-tight uppercase opacity-90">Menu</span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              className="w-52 p-1.5 mb-8 rounded-2xl bg-secondary/95 backdrop-blur-xl border-border/40 shadow-2xl"
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
      <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
      <span className="text-[10px] font-bold tracking-tight uppercase opacity-90">{label}</span>
    </Link>
  )
}

