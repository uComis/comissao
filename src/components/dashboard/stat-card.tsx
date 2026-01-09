import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  iconClassName
}: StatCardProps) {
  const isPositive = percentage !== undefined ? percentage >= 0 : true
  const displayPercentage =
    percentage !== undefined
      ? Number.isInteger(percentage)
        ? percentage.toString()
        : percentage.toFixed(1)
      : "0"
  const showTrend = percentage !== undefined && percentageLabel !== undefined


  const cardContent = (
    <Card className={cn(
      "h-full py-4",
      onClick ? "transition-all duration-200" : "border-none shadow-sm",
      active ? "border-2 border-primary/50 shadow-md scale-[1.02]" : onClick ? "border-2 border-transparent opacity-80 hover:opacity-100" : ""
    )}>
      <CardHeader className={cn(
        "flex flex-row items-center justify-between space-y-0 pb-2 px-6"
      )}>
        <CardTitle className={cn(
          "font-medium text-muted-foreground",
          onClick ? "text-xs uppercase tracking-wider" : "text-sm"
        )}>{label}</CardTitle>
        <Icon className={cn(
          "h-5 w-5",
          "text-muted-foreground/50",
          iconClassName
        )} />
      </CardHeader>
      <CardContent className={cn(
        "px-6 pt-0 mt-auto"
      )}>
        <div className={cn(
          "text-3xl font-bold leading-tight",
          valueClassName
        )}>{value}</div>
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

