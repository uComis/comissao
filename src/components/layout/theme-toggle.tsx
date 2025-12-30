'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Sun className="h-4 w-4 text-muted-foreground" />
        <div className="h-5 w-9 rounded-full bg-muted/50" />
        <Moon className="h-4 w-4 text-muted-foreground" />
      </div>
    )
  }

  const isDark = resolvedTheme === 'dark'

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <div className="flex items-center gap-3 px-2">
      <Sun 
        className={cn(
          "h-4 w-4 transition-colors",
          !isDark ? "text-foreground" : "text-muted-foreground/50"
        )} 
      />
      
      <button
        onClick={toggleTheme}
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isDark ? "bg-primary" : "bg-muted"
        )}
        aria-label="Alternar tema"
      >
        <span
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
            isDark ? "translate-x-4" : "translate-x-1"
          )}
        />
      </button>

      <Moon 
        className={cn(
          "h-4 w-4 transition-colors",
          isDark ? "text-foreground" : "text-muted-foreground/50"
        )} 
      />
    </div>
  )
}
