'use client'

import { ReactNode } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover'

type FilterPopoverProps = {
  children: ReactNode
  activeCount?: number
  onClear?: () => void
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function FilterPopover({
  children,
  activeCount = 0,
  onClear,
  align = 'start',
  className,
}: FilterPopoverProps) {
  const hasActiveFilters = activeCount > 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-8 gap-1.5 text-sm', className)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filtros</span>
          {hasActiveFilters && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-64 p-4">
        <div className="space-y-4">
          {children}

          {hasActiveFilters && onClear && (
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-muted-foreground"
                onClick={onClear}
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

type FilterPopoverFieldProps = {
  label: string
  children: ReactNode
}

export function FilterPopoverField({ label, children }: FilterPopoverFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}
