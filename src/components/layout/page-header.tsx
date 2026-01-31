'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePageHeader, usePageHeaderActions } from './page-header-context'
import { SidebarOpenTrigger } from './sidebar-open-trigger'

/** Rendered once in the layout — reads title/actions from context */
export function LayoutPageHeader() {
  const { title, description, backHref } = usePageHeader()
  const actions = usePageHeaderActions()

  const hasContent = title || actions

  return (
    <div className="bg-background border-b h-20 flex items-center relative">
      <div className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2">
        <SidebarOpenTrigger />
      </div>
      <div className="flex items-center justify-between gap-4 max-w-[1500px] mx-auto px-6 w-full">
        <div className="flex items-center gap-3 min-w-0">
          {backHref && (
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {title && (
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground truncate">{description}</p>
              )}
            </div>
          )}
        </div>
        {actions && (
          <div className="page-header-actions flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
