'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
  decimals?: number
}

export function PercentInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.5,
  className,
  decimals = 2,
}: Props) {
  function formatNumber(num: number, dec: number): string {
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    })
  }

  function parseNumber(str: string): number {
    const normalized = str.replace(/\./g, '').replace(',', '.')
    return parseFloat(normalized) || 0
  }

  const [displayValue, setDisplayValue] = useState(() => formatNumber(value, decimals))
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    setDisplayValue(formatNumber(value, decimals))
  }, [value, decimals])

  function decrement() {
    const newVal = Math.max(min, value - step)
    const rounded = Number(newVal.toFixed(decimals))
    onChange(rounded)
  }

  function increment() {
    const newVal = Math.min(max, value + step)
    const rounded = Number(newVal.toFixed(decimals))
    onChange(rounded)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
      .replace(/[^0-9.,]/g, '')
      .replace(/\./g, ',')
    setDisplayValue(raw)
  }

  function handleBlur() {
    setIsFocused(false)
    const num = parseNumber(displayValue)
    const clamped = Math.min(max, Math.max(min, num))
    const rounded = Number(clamped.toFixed(decimals))
    onChange(rounded)
    setDisplayValue(formatNumber(rounded, decimals))
  }

  function handleFocus() {
    setIsFocused(true)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      increment()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      decrement()
    }
  }

  return (
    <div className={cn('relative group', className)}>
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className="w-full h-12 px-3 text-center text-lg font-medium bg-background border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
      />
      {/* Controle à Direita: Porcentagem ou Setas */}
      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 w-8 flex flex-col justify-center items-center bg-background rounded-r-xl border-l transition-all duration-200',
          (isFocused || value !== 0) ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'
        )}
      >
        {/* Símbolo % - Visível quando não há hover/foco */}
        <span className={cn(
            "absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none transition-opacity duration-200 font-medium",
            (isFocused) ? "opacity-0" : "group-hover:opacity-0"
        )}>
          %
        </span>

        {/* Botões de Stepper - Visíveis no hover ou foco */}
        <div className={cn(
            "flex flex-col h-full w-full transition-opacity duration-200",
            (isFocused) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <button
            type="button"
            onClick={increment}
            disabled={value >= max}
            className="flex-1 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-tr-xl"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={decrement}
            disabled={value <= min}
            className="flex-1 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-br-xl border-t"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
