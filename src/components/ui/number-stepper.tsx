'use client'

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
  className,
  size = 'md',
}: Props) {
  function decrement() {
    const newVal = Math.max(min, value - step)
    onChange(Number(newVal.toFixed(2)))
  }

  function increment() {
    const newVal = max !== undefined ? Math.min(max, value + step) : value + step
    onChange(Number(newVal.toFixed(2)))
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
    const num = parseFloat(val)
    if (!isNaN(num)) {
      const clamped = max !== undefined ? Math.min(max, Math.max(min, num)) : Math.max(min, num)
      onChange(Number(clamped.toFixed(2)))
    } else if (val === '') {
      onChange(min)
    }
  }

  const sizeClasses = {
    sm: {
      container: 'h-9',
      button: 'w-9',
      icon: 'h-4 w-4',
      text: 'text-sm',
    },
    md: {
      container: 'h-12',
      button: 'w-12',
      icon: 'h-5 w-5',
      text: 'text-lg font-medium',
    },
    lg: {
      container: 'h-14',
      button: 'w-14',
      icon: 'h-6 w-6',
      text: 'text-2xl font-bold',
    },
  }

  const s = sizeClasses[size]

  return (
    <div className={cn('flex items-center rounded-md border bg-background', s.container, className)}>
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className={cn(
          'flex items-center justify-center h-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-l-md',
          s.button
        )}
      >
        <Minus className={s.icon} />
      </button>
      
      <div className="flex-1 flex items-center justify-center border-x">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleInputChange}
          className={cn('w-full h-full text-center bg-transparent outline-none', s.text)}
        />
        {suffix && <span className="text-muted-foreground mr-2">{suffix}</span>}
      </div>
      
      <button
        type="button"
        onClick={increment}
        disabled={max !== undefined && value >= max}
        className={cn(
          'flex items-center justify-center h-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-r-md',
          s.button
        )}
      >
        <Plus className={s.icon} />
      </button>
    </div>
  )
}

