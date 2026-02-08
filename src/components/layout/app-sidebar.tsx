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
import { Home, Users, Scale, ShoppingCart, Building2, Settings, Plus, Wallet, Shield, Bug, Mail, PanelLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppData, useUserMode } from '@/contexts/app-data-context'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { UsageWidget } from '@/components/billing/usage-widget'
import { SidebarTrialCard } from '@/components/billing/sidebar-trial-card'
import { UserControl } from './user-control'
import { useSidebar } from '@/components/ui/sidebar'
import { isDebugMode } from '@/lib/debug'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'


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
      { title: 'Dashboard', url: '/dashboard', icon: Home },
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
      { title: 'Home', url: '/home', icon: Home },
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
  const { profile, privacyMode } = useAppData()
  const { userMode } = useUserMode() // ✅ Usa contexto global (sem query)
  const { resolvedTheme } = useTheme()
  const { toggleSidebar } = useSidebar()
  const [mounted, setMounted] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const isSuperAdmin = profile?.is_super_admin === true

  useEffect(() => {
    setMounted(true)
    setDebugMode(isDebugMode())
  }, [])

  // Default para personal quando null (organizações desabilitadas)
  const menuSections = userMode === 'organization' ? orgMenuSections : personalMenuSections

  const isDark = mounted && resolvedTheme === 'dark'
  const logoSrc = isDark ? '/images/logo/uComis_white.png' : '/images/logo/uComis_black.png'

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center justify-between px-4 py-[clamp(1.5rem,5vh,2.5rem)]">
          <Image
            src={logoSrc}
            alt="uComis"
            width={140}
            height={28}
            priority
            className={cn(
              "h-7 w-auto opacity-90 hover:opacity-100 transition-opacity",
              !mounted && "invisible"
            )}
          />
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="Recolher menu"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        {menuSections.map((section, sectionIndex) => (
          <motion.div
            key={section.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.4,
              delay: sectionIndex * 0.1,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            {sectionIndex > 0 && <SidebarSeparator className="my-1 opacity-30" />}
            <SidebarGroup className="py-[clamp(0.5rem,2vh,1.5rem)]">
              <SidebarGroupLabel className="h-8 mb-1 text-[9px]">{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {section.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: (sectionIndex * 0.1) + (itemIndex * 0.05),
                        ease: [0.23, 1, 0.32, 1],
                      }}
                    >
                      <SidebarMenuItem className="relative">
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
                    </motion.div>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </motion.div>
        ))}
        
        {/* Seção Admin - só visível para super admin e quando NÃO está em modo privacidade */}
        {isSuperAdmin && !privacyMode && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
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
          </motion.div>
        )}
        
        {/* Seção Debug - só visível em localhost + DEBUG_MODE=true e quando NÃO está em modo privacidade */}
        {debugMode && !privacyMode && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <SidebarSeparator className="my-1 opacity-30" />
            <SidebarGroup className="py-[clamp(0.5rem,2vh,1.5rem)]">
              <SidebarGroupLabel className="h-8 mb-1 text-[9px]">Debug</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/debug'}>
                      <Link href="/debug">
                        <Bug />
                        <span>Debug Info</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/debug/email'}>
                      <Link href="/debug/email">
                        <Mail />
                        <span>Debug Email</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </motion.div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarTrialCard />
        <UsageWidget />
        {/* User Control - Desktop only */}
        <div className="hidden md:block">
          <UserControl />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

