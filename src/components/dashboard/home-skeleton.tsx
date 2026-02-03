import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function StatCardSkeleton() {
  return (
    <Card className="h-full py-3 md:py-4 gap-2 md:gap-6 border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 md:pb-2 px-3 md:px-6">
        <Skeleton className="h-3 md:h-4 w-20" />
        <Skeleton className="h-4 w-4 md:h-5 md:w-5 rounded" />
      </CardHeader>
      <CardContent className="px-3 md:px-6 pt-0 mt-auto space-y-2">
        <Skeleton className="h-7 md:h-9 w-28" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  )
}

function RankingCardSkeleton() {
  return (
    <Card className="border-none shadow-sm h-full overflow-hidden flex flex-col pt-4 pb-8 gap-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 md:pb-2 px-3 md:px-6">
        <Skeleton className="h-4 md:h-5 w-40" />
      </CardHeader>
      <CardContent className="px-3 md:px-6 flex-1 flex flex-col pt-0">
        <div className="mt-5 flex-1 flex flex-col gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-4 h-3" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ChartCardSkeleton() {
  return (
    <Card className="border-none shadow-sm h-full flex flex-col bg-card/50">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </CardHeader>
      <CardContent className="flex-1 pt-0 mt-4">
        <div className="min-h-[250px] flex flex-col justify-end gap-1 px-4">
          {/* Simulated chart bars */}
          <div className="flex items-end gap-2 h-[200px]">
            {[40, 65, 45, 80, 55, 70].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end">
                <Skeleton className="w-full rounded-t" style={{ height: `${h}%` }} />
              </div>
            ))}
          </div>
          {/* X axis labels */}
          <div className="flex gap-2 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-1 flex justify-center">
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function HomeSkeleton() {
  return (
    <div className="space-y-8 max-w-[1500px] mx-auto md:px-0">
      {/* Header: MonthPicker placeholder */}
      <div className="flex items-center justify-end max-w-[600px] lg:max-w-none mx-auto lg:mx-0">
        <Skeleton className="h-8 w-40" />
      </div>

      {/* Stats + Rankings grid */}
      <div className="grid gap-4 lg:grid-cols-4 max-w-[600px] lg:max-w-none mx-auto lg:mx-0">
        {/* 4 stat cards in 2x2 */}
        <div className="grid grid-cols-2 gap-2 md:gap-4 lg:col-span-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Ranking card (single on <1400, two on >=1400) */}
        <div className="lg:col-span-2 min-[1400px]:hidden">
          <RankingCardSkeleton />
        </div>
        <div className="hidden min-[1400px]:block">
          <RankingCardSkeleton />
        </div>
        <div className="hidden min-[1400px]:block">
          <RankingCardSkeleton />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-[600px] lg:max-w-none mx-auto lg:mx-0 pb-10">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  )
}
