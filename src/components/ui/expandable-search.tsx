'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { Button } from './button'

type ExpandableSearchProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  alwaysExpanded?: boolean
}

export function ExpandableSearch({
  value,
  onChange,
  placeholder = 'Buscar...',
  className,
  alwaysExpanded = false,
}: ExpandableSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Expand if value exists or alwaysExpanded
  const shouldExpand = alwaysExpanded || isExpanded || value.length > 0

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  function handleExpand() {
    setIsExpanded(true)
  }

  function handleBlur() {
    if (value.length === 0 && !alwaysExpanded) {
      setIsExpanded(false)
    }
  }

  function handleClear() {
    onChange('')
    inputRef.current?.focus()
  }

  if (!shouldExpand) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8 shrink-0', className)}
        onClick={handleExpand}
        aria-label="Abrir busca"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
      </Button>
    )
  }

  return (
    <div
      className={cn(
        'relative flex items-center',
        alwaysExpanded ? 'w-full' : 'w-[180px] animate-in slide-in-from-left-2 duration-200',
        className
      )}
    >
      <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        className="h-8 pl-8 pr-8 text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 text-muted-foreground hover:text-foreground"
          aria-label="Limpar busca"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
