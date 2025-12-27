import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'

type StatCardProps = {
  label: string
  value: string | number
  icon: LucideIcon
  percentage: number
  percentageLabel: string
}

export function StatCard({ label, value, icon: Icon, percentage, percentageLabel }: StatCardProps) {
  const isPositive = percentage >= 0
  const displayPercentage = Math.abs(percentage)

  return (
    <Card className="border-none shadow-sm h-full py-3 md:py-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 md:pb-2 px-3 md:px-6">
        <CardTitle className="text-sm md:text-base font-semibold">{label}</CardTitle>
        <Icon className="h-5 w-5 md:h-6 md:w-6" />
      </CardHeader>
      <CardContent className="px-3 md:px-6 pt-0 md:pt-0">
        <div className="text-2xl md:text-4xl font-bold leading-none md:leading-tight">{value}</div>
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
      </CardContent>
    </Card>
  )
}

