'use client'

import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ValueEntry = {
  id: string
  quantity: number
  grossValue: string
  taxRate: string
  commissionRate: string
  productId?: string | null
  productName?: string
}

type Props = {
  entry: ValueEntry
  isSwiped: boolean
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: () => void
  onClick: () => void
  onDelete: () => void
}

export function PersonalSaleItemSimple({
  entry,
  isSwiped,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onClick,
  onDelete,
}: Props) {
  const entryTotal = parseFloat(entry.grossValue) || 0
  const commissionValue = (entryTotal * (parseFloat(entry.commissionRate) || 0)) / 100
  const taxValue = (entryTotal * (parseFloat(entry.taxRate) || 0)) / 100

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Delete background revealed on swipe */}
      <div
        className={cn(
          'absolute inset-0 bg-destructive transition-opacity duration-200',
          isSwiped ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Main item content */}
      <div
        className={cn(
          'py-4 pl-3 pr-40 bg-card border border-border/60 rounded-xl transition-transform duration-200 relative min-h-[72px] shadow-sm',
          isSwiped ? '-translate-x-12' : 'translate-x-0'
        )}
        onClick={() => {
          if (isSwiped) {
            // Close swipe if clicked again
            return
          }
          onClick()
        }}
      >
        {/* Left side: Large value (hero element) */}
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-bold text-foreground">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(entryTotal)}
          </span>
        </div>

        {/* Right side - Absolute positioned */}
        <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col items-end gap-1">
          {/* Commission % - green */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/40 font-medium">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(commissionValue)}
            </span>
            <div className="text-base font-bold text-green-600">
              {entry.commissionRate || '0'}%
            </div>
          </div>

          {/* Tax % - orange */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/40 font-medium">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(taxValue)}
            </span>
            <div className="text-base font-bold text-orange-600">
              {entry.taxRate || '0'}%
            </div>
          </div>
        </div>
      </div>

      {/* Confirm delete button when swiped - vertically centered */}
      {isSwiped && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2"
        >
          <Trash2 className="h-5 w-5 text-white" />
        </button>
      )}
    </div>
  )
}
