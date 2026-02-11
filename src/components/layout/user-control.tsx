'use client'

import { useAppData } from '@/contexts/app-data-context'
import { useAuth } from '@/contexts'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, Building2, Users, LogOut } from 'lucide-react'

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
  const { profile, privacyMode } = useAppData()
  const { signOut } = useAuth()
  const router = useRouter()

  const name = privacyMode ? 'John Doe' : (profile?.name || 'Usuário')
  const email = privacyMode ? 'john.doe@ucomis.com.br' : profile?.email
  const initials = privacyMode
    ? 'MH'
    : (name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || profile?.email?.[0].toUpperCase() || 'U')

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:w-full w-auto"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {!privacyMode && <AvatarImage src={profile?.avatar_url || undefined} alt={email ?? ''} />}
                <AvatarFallback className="rounded-lg text-white font-semibold text-xs" style={{ backgroundColor: getAvatarColor(name) }}>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{name}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" className="w-56" align="start">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{name}</p>
                <p className="text-xs leading-none text-muted-foreground">{email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push('/minhaconta')}>
                <User />
                Meus Dados
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/fornecedores')}>
                <Building2 />
                Minhas Pastas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/clientes')}>
                <Users />
                Meus Clientes
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
