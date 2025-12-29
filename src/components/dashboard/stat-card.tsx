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
  const displayPercentage = percentage !== undefined ? Math.abs(percentage) : 0
  const showTrend = percentage !== undefined && percentageLabel !== undefined

  const cardContent = (
    <Card className={cn(
      "h-full py-3 md:py-6",
      onClick ? "transition-all duration-200" : "border-none shadow-sm",
      active ? "border-2 border-primary/50 shadow-md scale-[1.02]" : onClick ? "border-2 border-transparent opacity-80 hover:opacity-100" : ""
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 md:pb-2 px-3 md:px-6">
        <CardTitle className={cn(
          "font-semibold",
          onClick ? "text-xs uppercase tracking-wider text-muted-foreground" : "text-sm md:text-base"
        )}>{label}</CardTitle>
        <Icon className={cn("h-5 w-5 md:h-6 md:w-6", iconClassName)} />
      </CardHeader>
      <CardContent className="px-3 md:px-6 pt-0 md:pt-0">
        <div className={cn(
          "text-2xl md:text-4xl font-bold leading-none md:leading-tight",
          valueClassName
        )}>{value}</div>
        {showTrend ? (
          <div className="flex items-center gap-1 mt-2">
            <span className={`flex items-center text-xs md:text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
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

