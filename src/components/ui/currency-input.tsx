'use client'

import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string
  onChange: (value: string) => void
}

/**
 * Componente de entrada de moeda formatado para o padrão Brasileiro (BRL).
 * Gerencia a exibição com pontos de milhar e vírgula decimal automaticamente.
 * Converte pontos digitados pelo usuário em vírgulas.
 */
export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    
    // Formata o valor numérico (ex: "1500.50") para o padrão PT-BR ("1.500,50")
    const formatDisplay = (val: string) => {
      if (val === '' || val === undefined || val === null) return ''
      
      // Garante que estamos lidando com o formato interno (ponto para decimal)
      const parts = val.split('.')
      let integerPart = parts[0]
      const decimalPart = parts[1]
      
      // Se não houver parte inteira mas houver ponto (ex: ".50")
      if (!integerPart && val.startsWith('.')) integerPart = '0'
      
      // Formata os milhares
      const formattedInt = integerPart 
        ? parseInt(integerPart, 10).toLocaleString('pt-BR') 
        : integerPart === '0' ? '0' : ''
        
      if (decimalPart !== undefined) {
        return `${formattedInt},${decimalPart}`
      }
      return formattedInt
    }

    // Estado local para controlar o que o usuário vê (com formatação)
    const [displayValue, setDisplayValue] = React.useState(() => formatDisplay(value))
    const [prevValue, setPrevValue] = React.useState(value)

    if (value !== prevValue) {
      setPrevValue(value)
      const newFormatted = formatDisplay(value)
      if (newFormatted !== displayValue) {
        setDisplayValue(newFormatted)
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value
      
      // 1. Limpeza: remove pontos de milhar que o próprio componente colocou
      // mas mantém a vírgula decimal (ou ponto se o usuário digitou agora)
      let clean = input.replace(/\./g, '')
      
      // 2. Padronização: transforma ponto em vírgula (regra do usuário)
      clean = clean.replace(/,/g, '.')
      
      // 3. Validação: mantém apenas números e um único ponto decimal
      const parts = clean.split('.')
      if (parts.length > 2) {
        clean = parts[0] + '.' + parts.slice(1).join('')
      }
      clean = clean.replace(/[^0-9.]/g, '')

      // Valor interno para o form (ponto decimal)
      const numericValue = clean
      
      // Atualiza o display (com formatação de milhar em tempo real se possível)
      // No entanto, para evitar que o cursor pule no meio da digitação ao adicionar pontos,
      // vamos formatar o milhar APENAS se o usuário não estiver terminando com ponto
      let formatted = formatDisplay(numericValue)
      
      // Se o usuário acabou de digitar um ponto/vírgula, garantimos que a exibição mostre a vírgula
      if (input.endsWith(',') || input.endsWith('.')) {
          if (!formatted.includes(',')) {
              formatted += ','
          }
      }

      setDisplayValue(formatted)
      onChange(numericValue)
    }

    // Ao sair do campo, garantimos a formatação perfeita (ex: "1500" vira "1.500")
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setDisplayValue(formatDisplay(value))
      if (props.onBlur) props.onBlur(e)
    }

    return (
      <div className="relative w-full group">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium transition-colors group-focus-within:text-primary z-10">
          R$
        </span>
        <Input
          {...props}
          ref={ref}
          type="text"
          inputMode="decimal"
          className={cn(
            "pl-9 pr-4 h-11 text-sm font-semibold text-center shadow-md border-2 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary rounded-xl transition-all",
            className
          )}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </div>
    )
  }
)

CurrencyInput.displayName = "CurrencyInput"
