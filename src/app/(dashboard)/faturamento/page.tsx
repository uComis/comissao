import { Suspense } from 'react'
import { getReceivables, getReceivablesStats } from '@/app/actions/receivables'
import { ReceivablesClient } from '../recebiveis/client'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/fade-in'

async function FaturamentoContent() {
  const [receivables, stats] = await Promise.all([
    getReceivables(),
    getReceivablesStats(),
  ])

  return <FadeIn><ReceivablesClient receivables={receivables} stats={stats} isHome /></FadeIn>
}

function FaturamentoLoading() {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Stat cards: 2x2 mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="py-3 md:py-4 gap-2 md:gap-6 border-none shadow-sm">
            <div className="px-3 md:px-6 flex items-center justify-between">
              <Skeleton className="h-3 md:h-4 w-20" />
              <Skeleton className="h-4 w-4 md:h-5 md:w-5 rounded" />
            </div>
            <div className="px-3 md:px-6 space-y-2">
              <Skeleton className="h-7 md:h-9 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <Card className="p-3 hidden md:block">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-8 w-[150px]" />
          <Skeleton className="h-8 w-[150px]" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-[140px]" />
        </div>
      </Card>
      <Card className="p-3 md:hidden">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-[140px]" />
        </div>
      </Card>

      {/* Receivables list grouped by month */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 3 }).map((_, j) => (
            <Card key={j} className="p-3 border-none shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function FaturamentoPage() {
  return (
    <Suspense fallback={<FaturamentoLoading />}>
      <FaturamentoContent />
    </Suspense>
  )
}

