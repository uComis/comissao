import * as React from 'react'
import { cn } from '@/lib/utils'

interface DashedActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
  prominent?: boolean
}

/**
 * Botão dashed para ações de seção (adicionar valor, configurar pagamento, etc.)
 *
 * - Estilo padrão: muted (cinza), h-12
 * - `prominent`: h-16, borda mais visível — usado quando a seção está vazia
 */
function DashedActionButton({
  icon,
  prominent,
  className,
  children,
  ...props
}: DashedActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'w-full flex items-center justify-center gap-2 h-14 border-2 border-dashed border-border rounded-xl text-sm text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors',
        prominent && 'h-[4.5rem] text-base border-foreground/30 text-foreground/70',
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

export { DashedActionButton }
