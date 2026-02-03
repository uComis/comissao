'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type OptionPickerItem<T extends string = string> = {
  value: T
  label: string
}

interface OptionPickerProps<T extends string = string> {
  options: OptionPickerItem<T>[]
  value: T
  onChange: (value: T) => void
}

export function OptionPicker<T extends string = string>({
  options,
  value,
  onChange,
}: OptionPickerProps<T>) {
  const currentIndex = options.findIndex((o) => o.value === value)
  const current = options[currentIndex]

  const isFirst = currentIndex <= 0
  const isLast = currentIndex >= options.length - 1

  const go = (delta: number) => {
    const next = currentIndex + delta
    if (next >= 0 && next < options.length) {
      onChange(options[next].value)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isFirst} onClick={() => go(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium min-w-[100px] text-center">{current?.label ?? ''}</span>
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLast} onClick={() => go(1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
