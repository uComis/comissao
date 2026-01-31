'use client'

import { UserControl } from './user-control'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timeout)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'
  const logoSrc = isDark ? '/images/logo/uComis_white.png' : '/images/logo/uComis_black.png'

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  if (!mounted) {
    return (
      <header className="flex md:hidden h-20 shrink-0 items-center gap-4 bg-background px-8 border-b">
        <div className="flex-1" />
      </header>
    )
  }

  return (
    <header className="flex md:hidden h-20 shrink-0 items-center gap-4 bg-background px-8 border-b">
      {/* Logo mobile */}
      <Link href="/home">
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

      {/* Mobile: Simple icon button */}
      <button
        onClick={toggleTheme}
        className={cn(
          "p-2 rounded-lg transition-colors",
          "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label="Alternar tema"
      >
        {isDark ? (
          <Moon className="h-5 w-5 text-foreground" />
        ) : (
          <Sun className="h-5 w-5 text-foreground" />
        )}
      </button>

      {/* User Control - Mobile only */}
      <div className="-mr-4">
        <UserControl />
      </div>
    </header>
  )
}
