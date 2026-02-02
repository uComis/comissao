'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MonthPickerProps {
  value: Date
  onChange: (date: Date) => void
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const now = new Date()
  const isCurrentMonth =
    value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth()

  const label = value
    .toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())

  const go = (delta: number) => {
    const next = new Date(value.getFullYear(), value.getMonth() + delta, 1)
    onChange(next)
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => go(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium min-w-[130px] text-center">{label}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={isCurrentMonth}
        onClick={() => go(1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
