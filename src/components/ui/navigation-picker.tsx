'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type NavigationPickerProps = {
  children: ReactNode
  className?: string
}

/**
 * Wrapper visual para navegação temporal (MonthPicker) ou de status (OptionPicker).
 * Centraliza o conteúdo entre o card de filtros e a tabela/lista.
 */
export function NavigationPicker({ children, className }: NavigationPickerProps) {
  return (
    <div className={cn('flex justify-center py-2', className)}>
      {children}
    </div>
  )
}
