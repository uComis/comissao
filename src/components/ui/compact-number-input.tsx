'use client'

import { useState } from 'react'
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
  suffix?: string
  accentColor?: string
}

export function CompactNumberInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.5,
  className,
  decimals = 2,
  suffix,
  accentColor,
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
  const [prevValue, setPrevValue] = useState(value)

  if (value !== prevValue) {
    setPrevValue(value)
    setDisplayValue(formatNumber(value, decimals))
  }

  function decrement() {
    const newVal = Math.max(min, value - step)
    const rounded = Number(newVal.toFixed(decimals))
    onChange(rounded)
  }

  function increment() {
    const newVal = max !== undefined ? Math.min(max, value + step) : value + step
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
    const clamped = max !== undefined ? Math.min(max, Math.max(min, num)) : Math.max(min, num)
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
    <div 
        className={cn(
            'relative group border-2 rounded-xl transition-all duration-200 bg-background overflow-hidden shadow-md',
            isFocused && !accentColor ? 'border-primary ring-2 ring-primary/20' : 'border-border',
            className
        )}
        style={{ 
            borderLeftColor: accentColor,
            borderLeftWidth: accentColor ? '4px' : undefined,
            // Se houver accentColor e estiver focado, expande a cor para as outras bordas sem sobrescrever a esquerda
            ...(isFocused && accentColor ? {
                borderTopColor: accentColor,
                borderRightColor: accentColor,
                borderBottomColor: accentColor,
                boxShadow: `0 0 0 2px ${accentColor}33`
            } : {})
        }}
    >
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={cn(
            "w-full h-11 pl-3 pr-8 text-center text-sm font-medium bg-transparent text-foreground outline-none border-none",
        )}
      />
      
      {/* Controle à Direita: Sufixo ou Setas */}
      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 w-8 flex flex-col justify-center items-center bg-background border-l transition-all duration-200',
          (isFocused || value !== 0 || !suffix) ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'
        )}
        style={{
            borderLeftColor: isFocused ? (accentColor ? `${accentColor}4D` : undefined) : undefined // 4D is ~30%
        }}
      >
        {/* Símbolo (ex: %) - Visível quando não há hover/foco e existe sufixo */}
        {suffix && (
            <span className={cn(
                "absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none transition-opacity duration-200 font-medium text-sm",
                (isFocused) ? "opacity-0" : "group-hover:opacity-0"
            )}>
              {suffix}
            </span>
        )}

        {/* Botões de Stepper - Visíveis no hover ou foco, ou sempre se não houver sufixo */}
        <div className={cn(
            "flex flex-col h-full w-full transition-opacity duration-200",
            (!suffix || isFocused) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <button
            type="button"
            onClick={increment}
            disabled={max !== undefined && value >= max}
            className="flex-1 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={decrement}
            disabled={value <= min}
            className="flex-1 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-t"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
