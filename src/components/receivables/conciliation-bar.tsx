'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  selectedCount: number
  totalCount: number
  selectedTotal: number
  onClear: () => void
  onConfirm: () => void
  formatCurrency: (value: number) => string
}

export function ConciliationBar({ selectedCount, totalCount, selectedTotal, onClear, onConfirm, formatCurrency }: Props) {
  const isVisible = selectedCount > 0

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <div className="px-4 pb-4 md:pb-6 max-w-4xl mx-auto">
        {/* Progress indicator - centered above */}
        <div className="text-center pb-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {selectedCount} de {totalCount}
          </span>
        </div>

        <div className="bg-primary text-primary-foreground rounded-2xl shadow-2xl border border-white/10 p-4 flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold">{selectedCount} parcelas selecionadas</span>
            <span className="text-xs opacity-80">Total: {formatCurrency(selectedTotal)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClear}
              className="font-bold"
            >
              Limpar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onConfirm}
              className="bg-white text-black hover:bg-slate-100 font-bold shadow-lg"
            >
              <CheckCircle className="mr-1.5 h-4 w-4 text-green-600" />
              Confirmar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
