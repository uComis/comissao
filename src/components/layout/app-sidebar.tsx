'use client'

import { useEffect, useState } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Home, Users, Scale, ShoppingCart, BarChart3, Building2, Calendar, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'

type UserMode = 'personal' | 'organization' | null

const orgMenuItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Vendedores', url: '/vendedores', icon: Users },
  { title: 'Regras', url: '/regras', icon: Scale },
  { title: 'Vendas', url: '/vendas', icon: ShoppingCart },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
]

const personalMenuItems = [
  { title: 'Início', url: '/home', icon: Home },
  { title: 'Minhas Pastas', url: '/fornecedores', icon: Building2 },
  { title: 'Minhas Vendas', url: '/minhasvendas', icon: ShoppingCart },
  { title: 'Recebíveis', url: '/recebiveis', icon: Calendar },
  { title: 'Minha Conta', url: '/minhaconta', icon: User },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [userMode, setUserMode] = useState<UserMode>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserMode() {
      if (!user) {
        setLoading(false)
        return
      }

      const supabase = createClient()
      if (!supabase) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('user_preferences')
        .select('user_mode')
        .eq('user_id', user.id)
        .single()

      setUserMode(data?.user_mode || null)
      setLoading(false)
    }

    fetchUserMode()
  }, [user])

  const menuItems = userMode === 'personal' ? personalMenuItems : orgMenuItems
  const modeLabel = userMode === 'personal' ? 'Vendedor' : 'Empresa'

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">C</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">Comissao.io</span>
            {!loading && userMode && (
              <span className="text-xs text-muted-foreground">{modeLabel}</span>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-4 py-2 text-xs text-muted-foreground">© 2025 Comissao.io</div>
      </SidebarFooter>
    </Sidebar>
  )
}
