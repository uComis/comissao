'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle } from './theme-toggle'
import { UserControl } from './user-control'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'

export function Header() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timeout)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'
  const logoSrc = isDark ? '/images/logo/uComis_white.svg' : '/images/logo/uComis_black.svg'

  if (!mounted) {
    return (
      <header className="flex h-20 md:h-14 shrink-0 items-center gap-4 bg-background px-8 md:px-4">
        <SidebarTrigger className="hidden md:flex" />
        <div className="flex-1" />
      </header>
    )
  }

  return (
    <header className="flex h-20 md:h-14 shrink-0 items-center gap-4 bg-background px-8 md:px-4">
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

      {/* User Control - Mobile only */}
      <div className="md:hidden">
        <UserControl />
      </div>
    </header>
  )
}
