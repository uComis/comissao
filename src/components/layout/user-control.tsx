'use client'

import { useUser } from '@/contexts/app-data-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import Link from 'next/link'

export function UserControl() {
  const { profile } = useUser()

  const name = profile?.name || 'Usuário'
  const initials = name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || profile?.email?.[0].toUpperCase() || 'U'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          asChild
          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:w-full w-auto"
        >
          <Link href="/minhaconta">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.email ?? ''} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden md:grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{name}</span>
              <span className="truncate text-xs">{profile?.email}</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
