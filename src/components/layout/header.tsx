'use client'

import { UserControl } from './user-control'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePageHeader, usePageHeaderActions } from './page-header-context'

/**
 * Unified mobile top bar.
 * - Home: shows logo + avatar
 * - Internal pages: shows title + actions + avatar
 */
export function Header() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { title, backHref } = usePageHeader()
  const actions = usePageHeaderActions()

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timeout)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'
  const logoSrc = isDark ? '/images/logo/uComis_white.png' : '/images/logo/uComis_black.png'
  const isHome = pathname === '/home' || pathname === '/' || pathname === '/dashboard'

  if (!mounted) {
    return (
      <header className="flex md:hidden h-14 shrink-0 items-center bg-background px-4 border-b">
        <div className="flex-1" />
      </header>
    )
  }

  return (
    <header className="flex md:hidden h-14 shrink-0 items-center gap-3 bg-background px-4 border-b">
      {/* Left side: logo or title — takes remaining space */}
      {isHome ? (
        <Link href="/home" className="shrink-0">
          <Image
            src={logoSrc}
            alt="uComis"
            width={100}
            height={20}
            priority
            className="h-5 w-auto"
          />
        </Link>
      ) : (
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {backHref && (
            <Button variant="ghost" size="icon" asChild className="shrink-0 h-9 w-9">
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {title && (
            <h1 className="text-base font-semibold tracking-tight truncate">{title}</h1>
          )}
        </div>
      )}

      {/* Spacer — only needed on home where logo doesn't flex-1 */}
      {isHome && <div className="flex-1" />}

      {/* Right side: actions + avatar */}
      <div className="flex items-center gap-2 shrink-0">
        {!isHome && actions}
        <UserControl />
      </div>
    </header>
  )
}
