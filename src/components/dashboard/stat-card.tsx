'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'
import { formatCurrencyAbbreviated, formatCurrencyNoCents, estimateTextWidth } from '@/lib/format-utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type StatCardProps = {
  label: string
  value: string | number
  icon: LucideIcon
  percentage?: number
  percentageLabel?: string
  subtitle?: string
  onClick?: () => void
  active?: boolean
  valueClassName?: string
  iconClassName?: string
  progress?: number
  remainingLabel?: string
  showProgressBar?: boolean
}

export function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  percentage, 
  percentageLabel,
  subtitle,
  onClick,
  active,
  valueClassName,
  iconClassName,
  progress,
  remainingLabel,
  showProgressBar
}: StatCardProps) {
  const isPositive = percentage !== undefined ? percentage >= 0 : true
  const displayPercentage =
    percentage !== undefined
      ? Number.isInteger(percentage)
        ? percentage.toString()
        : percentage.toFixed(1)
      : "0"
  const showTrend = percentage !== undefined && percentageLabel !== undefined

  const getProgressColor = (val: number) => {
    if (val <= 25) return 'text-red-500'
    if (val <= 50) return 'text-orange-500'
    if (val <= 75) return 'text-blue-500'
    return 'text-green-500'
  }

  const getProgressBgColor = (val: number) => {
    if (val <= 25) return 'bg-red-500'
    if (val <= 50) return 'bg-orange-500'
    if (val <= 75) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const progressColorClass = progress !== undefined ? getProgressColor(progress) : ''
  const progressBgClass = progress !== undefined ? getProgressBgColor(progress) : ''

  // Smart value formatting based on available width
  const contentRef = useRef<HTMLDivElement>(null)
  const [displayValue, setDisplayValue] = useState<string>(value.toString())
  const [fontSize, setFontSize] = useState<'text-3xl' | 'text-2xl' | 'text-xl'>('text-3xl')
  const [tooltipContent, setTooltipContent] = useState<string | null>(null)

  useEffect(() => {
    if (!contentRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const availableWidth = entry.contentRect.width - 32 // padding
        const valueStr = value.toString()

        // Font size mappings (desktop sizes)
        const fontSizes = [
          { class: 'text-3xl', px: 30 },
          { class: 'text-2xl', px: 24 },
          { class: 'text-xl', px: 20 }
        ] as const

        let fitted = false

        // Try each font size
        for (const { class: fontClass, px } of fontSizes) {
          const estimatedWidth = estimateTextWidth(valueStr, px)
          
          if (estimatedWidth <= availableWidth) {
            setDisplayValue(valueStr)
            setFontSize(fontClass)
            setTooltipContent(null)
            fitted = true
            break
          }
        }

        // If still doesn't fit, try removing cents
        if (!fitted && typeof value === 'string' && value.includes(',')) {
          const noCents = formatCurrencyNoCents(valueStr)
          const estimatedWidth = estimateTextWidth(noCents, 20) // text-xl
          
          if (estimatedWidth <= availableWidth) {
            setDisplayValue(noCents)
            setFontSize('text-xl')
            setTooltipContent(valueStr)
            fitted = true
          }
        }

        // Last resort: abbreviate
        if (!fitted && typeof value === 'string' && value.startsWith('R$')) {
          // Extract numeric value from formatted string
          const numericValue = parseFloat(
            valueStr.replace('R$', '').replace(/\./g, '').replace(',', '.')
          )
          
          if (!isNaN(numericValue)) {
            const { short, full, abbreviated } = formatCurrencyAbbreviated(numericValue)
            setDisplayValue(short)
            setFontSize('text-xl')
            setTooltipContent(abbreviated ? full : null)
          }
        }
      }
    })

    observer.observe(contentRef.current)
    return () => observer.disconnect()
  }, [value])


  const cardContent = (
    <Card className={cn(
      "h-full py-3 md:py-4 gap-2 md:gap-6 relative overflow-hidden",
      showProgressBar && "pb-5",
      onClick ? "transition-all duration-200" : "border-none shadow-sm",
      active ? "border-2 border-primary/50 shadow-md scale-[1.02]" : onClick ? "border-2 border-transparent hover:bg-accent/50" : ""
    )}>
      <CardHeader className={cn(
        "flex flex-row items-center justify-between space-y-0 pb-0 md:pb-2",
        "px-3 md:px-6"
      )}>
        <CardTitle className="font-medium text-muted-foreground text-xs md:text-sm">
          {label}
        </CardTitle>
        
        {/* Show circular progress in header if exists, otherwise show icon */}
        {progress !== undefined ? (
          <div className="relative h-10 w-10 shrink-0 flex items-center justify-center">
            <svg className="h-full w-full -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="4"
                className="text-muted/20"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={100}
                strokeDashoffset={100 - progress}
                strokeLinecap="round"
                className={cn("transition-all duration-500", progressColorClass)}
              />
            </svg>
            <span className={cn("absolute text-[10px] font-bold", progressColorClass)}>{Math.round(progress)}%</span>
          </div>
        ) : (
          <Icon className={cn(
            "h-4 w-4 md:h-5 md:w-5",
            "text-muted-foreground/50",
            iconClassName
          )} />
        )}
      </CardHeader>
      <CardContent ref={contentRef} className={cn(
        "px-3 md:px-6 pt-0 mt-auto"
      )}>
        <div className="flex items-end justify-between gap-2">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "font-bold leading-tight cursor-default",
                  "text-xl md:text-2xl",
                  fontSize === 'text-3xl' && "md:!text-3xl",
                  valueClassName
                )}>
                  {displayValue}
                </div>
              </TooltipTrigger>
              {tooltipContent && (
                <TooltipContent 
                  side="top" 
                  className="text-sm font-semibold"
                  sideOffset={5}
                >
                  {tooltipContent}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {remainingLabel && (
          <p className={cn("text-[10px] font-semibold mt-2 truncate", progressColorClass)}>
            {remainingLabel}
          </p>
        )}
        {showTrend ? (
          <div className="flex items-center gap-1 mt-2">
            <span className={cn(
              "flex items-center font-medium",
              "text-xs",
              isPositive ? 'text-green-500' : 'text-red-500'
            )}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {isPositive ? '+' : ''}
              {displayPercentage}%
            </span>
            <span className="text-muted-foreground" style={{ fontSize: '10px' }}>{percentageLabel}</span>
          </div>
        ) : subtitle ? (
          <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase">{subtitle}</p>
        ) : null}
      </CardContent>

      {showProgressBar && progress !== undefined && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-muted/20">
          <div 
            className={cn("h-full transition-all duration-500", progressBgClass)}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </Card>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className="text-left w-full">
        {cardContent}
      </button>
    )
  }

  return cardContent
}

