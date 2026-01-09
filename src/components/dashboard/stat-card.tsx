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


  const cardContent = (
    <Card className={cn(
      "h-full py-4 relative overflow-hidden",
      showProgressBar && "pb-5",
      onClick ? "transition-all duration-200" : "border-none shadow-sm",
      active ? "border-2 border-primary/50 shadow-md scale-[1.02]" : onClick ? "border-2 border-transparent hover:bg-accent/50" : ""
    )}>
      <CardHeader className={cn(
        "flex flex-row items-center justify-between space-y-0 pb-2 px-6"
      )}>
        <CardTitle className="font-medium text-muted-foreground text-sm">
          {label}
        </CardTitle>
        <Icon className={cn(
          "h-5 w-5",
          "text-muted-foreground/50",
          iconClassName
        )} />
      </CardHeader>
      <CardContent className={cn(
        "px-6 pt-0 mt-auto"
      )}>
        <div className="flex items-end justify-between gap-2">
          <div className={cn(
            "text-3xl font-bold leading-tight",
            valueClassName
          )}>{value}</div>
          
          {progress !== undefined && (
            <div className="relative h-10 w-10 shrink-0 mb-1 lg:flex hidden items-center justify-center">
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
          )}
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

