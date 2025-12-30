'use client'

import { useAuth } from '@/contexts/auth-context'
import { useUser } from '@/contexts/user-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle } from './theme-toggle'
import { LogOut, User, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { useTheme } from 'next-themes'

export function Header() {
  const { signOut } = useAuth()
  const { profile } = useUser()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timeout)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'
  const logoSrc = isDark ? '/images/logo/uComis_white.svg' : '/images/logo/uComis_black.svg'

  const name = profile?.name || 'Usuário'
  const initials = name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || profile?.email?.[0].toUpperCase() || 'U'

  if (!mounted) {
    return (
      <header className="flex h-20 md:h-14 shrink-0 items-center gap-4 border-b bg-background px-8 md:px-4">
        <SidebarTrigger className="hidden md:flex" />
        <div className="flex-1" />
      </header>
    )
  }

  return (
    <header className="flex h-20 md:h-14 shrink-0 items-center gap-4 border-b bg-background px-8 md:px-4">
      <SidebarTrigger className="hidden md:flex" />

      {/* Logo mobile */}
      <Link href="/home" className="md:hidden">
        <Image
          src={logoSrc}
          alt="uComis"
          width={100}
          height={20}
          priority
          className="h-5 w-auto"
        />
      </Link>

      <div className="flex-1" />

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.email ?? ''} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium leading-none">{name}</p>
                {profile?.is_super_admin && (
                  <Badge variant="secondary" className="h-5 px-2 py-0 text-[10px]">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/minhaconta">
              <User className="mr-2 h-4 w-4" />
              <span>Minha conta</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/cobrancas">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Minha assinatura</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
