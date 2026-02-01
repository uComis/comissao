'use client'

import { useUser } from '@/contexts/app-data-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import Link from 'next/link'

const avatarColors = [
  '#E11D48', // rose-600
  '#9333EA', // purple-600
  '#2563EB', // blue-600
  '#0891B2', // cyan-600
  '#059669', // emerald-600
  '#D97706', // amber-600
  '#DC2626', // red-600
  '#7C3AED', // violet-600
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

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
              <AvatarFallback className="rounded-lg text-white font-semibold text-xs" style={{ backgroundColor: getAvatarColor(name) }}>{initials}</AvatarFallback>
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
