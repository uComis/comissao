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
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Home, Users, Scale, ShoppingCart, Building2, Settings, Plus, LayoutDashboard, Wallet, Shield } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useUser } from '@/contexts/user-context'
import { createClient } from '@/lib/supabase'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { UsageWidget } from '@/components/billing/usage-widget'

type UserMode = 'personal' | 'organization' | null

type MenuItem = {
  title: string
  url: string
  icon: React.ElementType
  actionUrl?: string
}

type MenuSection = {
  label: string
  items: MenuItem[]
}

const orgMenuSections: MenuSection[] = [
  {
    label: 'Dashboard',
    items: [
      { title: 'Dashboard', url: '/', icon: Home },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { title: 'Vendedores', url: '/vendedores', icon: Users },
      { title: 'Regras', url: '/regras', icon: Scale },
      { title: 'Vendas', url: '/vendas', icon: ShoppingCart },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { title: 'Configurações', url: '/configuracoes', icon: Settings },
    ],
  },
]

const personalMenuSections: MenuSection[] = [
  {
    label: 'Vendas',
    items: [
      { title: 'Analytics', url: '/home', icon: LayoutDashboard },
      { title: 'Minhas Vendas', url: '/minhasvendas', icon: ShoppingCart, actionUrl: '/minhasvendas/nova' },
    ],
  },
  {
    label: 'Resultados',
    items: [
      { title: 'Faturamento', url: '/faturamento', icon: Wallet },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { title: 'Meus Clientes', url: '/clientes', icon: Users },
      { title: 'Minhas Pastas', url: '/fornecedores', icon: Building2 },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { profile } = useUser()
  const { resolvedTheme } = useTheme()
  const [userMode, setUserMode] = useState<UserMode>(null)
  const [mounted, setMounted] = useState(false)
  const isSuperAdmin = profile?.is_super_admin === true

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true)
    
    async function fetchUserMode() {
      if (!user) return

      const supabase = createClient()
      if (!supabase) return

      const { data } = await supabase
        .from('user_preferences')
        .select('user_mode')
        .eq('user_id', user.id)
        .single()

      setUserMode(data?.user_mode || null)
    }

    fetchUserMode()
  }, [user])

  const menuSections = userMode === 'personal' ? personalMenuSections : orgMenuSections

  const isDark = mounted && resolvedTheme === 'dark'
  const logoSrc = isDark ? '/images/logo/uComis_white.svg' : '/images/logo/uComis_black.svg'

  if (!mounted) return null

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center justify-center px-4 py-[clamp(1.5rem,5vh,2.5rem)]">
          <Image
            src={logoSrc}
            alt="uComis"
            width={140}
            height={28}
            priority
            className="h-7 w-auto opacity-90 hover:opacity-100 transition-opacity"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuSections.map((section, index) => (
          <div key={section.label}>
            {index > 0 && <SidebarSeparator className="my-1 opacity-30" />}
            <SidebarGroup className="py-[clamp(0.5rem,2vh,1.5rem)]">
              <SidebarGroupLabel className="h-8 mb-1 text-[9px]">{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.title} className="relative">
                      <SidebarMenuButton asChild isActive={pathname === item.url || pathname === item.actionUrl}>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.actionUrl && (
                        <Link
                          href={item.actionUrl}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Nova Venda"
                        >
                          <Plus className="h-4 w-4" />
                        </Link>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ))}
        
        {/* Seção Admin - só visível para super admin */}
        {isSuperAdmin && (
          <>
            <SidebarSeparator className="my-1 opacity-30" />
            <SidebarGroup className="py-[clamp(0.5rem,2vh,1.5rem)]">
              <SidebarGroupLabel className="h-8 mb-1 text-[9px]">Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/usuarios')}>
                      <Link href="/admin/usuarios">
                        <Shield />
                        <span>Usuários</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <UsageWidget />
      </SidebarFooter>
    </Sidebar>
  )
}

