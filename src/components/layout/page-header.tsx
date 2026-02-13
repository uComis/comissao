'use client'

import Link from 'next/link'
import { ArrowLeft, Sparkles, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePageHeader, usePageHeaderActions } from './page-header-context'
import { SidebarOpenTrigger } from './sidebar-open-trigger'
import { useAiChat } from '@/components/ai-assistant'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const HINT_KEY = 'kai_hint_seen'

/** Rendered once in the layout — reads title/actions from context */
export function LayoutPageHeader() {
  const { title, backHref, contentMaxWidth } = usePageHeader()
  const actions = usePageHeaderActions()
  const { isOpen, toggle: toggleAiChat } = useAiChat()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!localStorage.getItem(HINT_KEY)) {
      setShowHint(true)
    }
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'

  const handleKaiClick = useCallback(() => {
    if (showHint) {
      setShowHint(false)
      localStorage.setItem(HINT_KEY, '1')
    }
    toggleAiChat()
  }, [showHint, toggleAiChat])

  // Dismiss hint when Kai opens (e.g. via Ctrl+K)
  useEffect(() => {
    if (isOpen && showHint) {
      setShowHint(false)
      localStorage.setItem(HINT_KEY, '1')
    }
  }, [isOpen, showHint])

  return (
    <div className="bg-background border-b h-20 flex items-center">
      <div className="max-w-[1500px] mx-auto px-6 w-full">
        <div className={cn(
          "flex items-center justify-between gap-4 w-full",
          contentMaxWidth && `${contentMaxWidth} mx-auto`
        )}>
        <div className="flex items-center gap-3 min-w-0 relative">
          <div className="hidden md:block">
            <SidebarOpenTrigger />
          </div>
          {backHref && (
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {title && (
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isDark ? 'Tema claro' : 'Tema escuro'}</TooltipContent>
          </Tooltip>
          <Tooltip open={showHint ? true : undefined}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleKaiClick}
                className={cn('gap-1.5 relative', showHint && 'kai-hint-pulse')}
              >
                <Sparkles className="h-4 w-4" />
                Kai
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {showHint ? 'Conheça o Kai, seu assistente de IA ✨' : 'Abrir Kai (Ctrl+K)'}
            </TooltipContent>
          </Tooltip>
          {actions && <div className="ml-2 flex items-center gap-2">{actions}</div>}
        </div>
      </div>
      </div>
    </div>
  )
}
