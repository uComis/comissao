'use client'

import { useState, useEffect } from 'react'
import { PanelLeft } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'

export function SidebarOpenTrigger() {
  const { open, toggleSidebar } = useSidebar()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setVisible(false)
      return
    }

    // Wait for sidebar close animation to finish, then slide in
    const timer = setTimeout(() => setVisible(true), 400)
    return () => clearTimeout(timer)
  }, [open])

  if (open) return null

  return (
    <button
      onClick={toggleSidebar}
      className={`p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 shrink-0 ${
        visible
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 -translate-x-3'
      }`}
      aria-label="Abrir menu"
    >
      <PanelLeft className="h-4 w-4" />
    </button>
  )
}
