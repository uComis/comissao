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
          'py-4 px-4 bg-card border border-border/60 rounded-xl transition-all duration-200 shadow-sm cursor-pointer hover:border-border hover:bg-accent/50',
          isSwiped ? '-translate-x-12' : 'translate-x-0'
        )}
        onClick={() => {
          if (isSwiped) return
          onClick()
        }}
      >
        {/* Desktop: row — value left, percentages right */}
        {/* Mobile: stacked — value centered, percentages below */}
        <div className="flex flex-col items-center lg:flex-row lg:items-center lg:justify-between gap-1.5">
          <span className="text-2xl font-bold text-foreground">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(entryTotal)}
          </span>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="hidden lg:inline text-xs text-muted-foreground/50 font-medium">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(taxValue)}
              </span>
              <span className="text-sm font-bold text-orange-600">
                {entry.taxRate || '0'}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="hidden lg:inline text-xs text-muted-foreground/50 font-medium">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(commissionValue)}
              </span>
              <span className="text-sm font-bold text-green-600">
                {entry.commissionRate || '0'}%
              </span>
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
