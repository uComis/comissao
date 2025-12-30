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
  density?: 'compact' | 'regular'
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
  density = 'compact',
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

  const isRegular = density === 'regular'

  const cardContent = (
    <Card className={cn(
      "h-full py-3 @container/stat-card",
      isRegular ? "@[320px]/stat-card:py-6" : "@[360px]/stat-card:py-6",
      onClick ? "transition-all duration-200" : "border-none shadow-sm",
      active ? "border-2 border-primary/50 shadow-md scale-[1.02]" : onClick ? "border-2 border-transparent opacity-80 hover:opacity-100" : ""
    )}>
      <CardHeader className={cn(
        "flex flex-row items-center justify-between space-y-0 pb-0 px-3",
        isRegular ? "@[320px]/stat-card:pb-2 @[320px]/stat-card:px-6" : "@[360px]/stat-card:pb-2 @[360px]/stat-card:px-6"
      )}>
        <CardTitle className={cn(
          "font-medium text-muted-foreground",
          onClick ? "text-xs uppercase tracking-wider" : (isRegular ? "text-sm @[320px]/stat-card:text-base" : "text-sm @[360px]/stat-card:text-base")
        )}>{label}</CardTitle>
        <Icon className={cn(
          isRegular ? "h-5 w-5 @[320px]/stat-card:h-6 @[320px]/stat-card:w-6" : "h-5 w-5 @[360px]/stat-card:h-6 @[360px]/stat-card:w-6",
          "text-muted-foreground/50",
          iconClassName
        )} />
      </CardHeader>
      <CardContent className={cn(
        "px-3 pt-0 mt-auto",
        isRegular ? "@[320px]/stat-card:px-6 @[320px]/stat-card:pt-0" : "@[360px]/stat-card:px-6 @[360px]/stat-card:pt-0"
      )}>
        <div className={cn(
          isRegular ? "text-2xl @[320px]/stat-card:text-4xl font-bold leading-none @[320px]/stat-card:leading-tight" : "text-2xl @[360px]/stat-card:text-4xl font-bold leading-none @[360px]/stat-card:leading-tight",
          valueClassName
        )}>{value}</div>
        {showTrend ? (
          <div className="flex items-center gap-1 mt-2">
            <span className={cn(
              "flex items-center font-medium",
              isRegular ? "text-xs @[320px]/stat-card:text-sm" : "text-xs @[360px]/stat-card:text-sm",
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

