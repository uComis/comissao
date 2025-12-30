import { Suspense } from 'react'
import { getReceivables, getReceivablesStats } from '@/app/actions/receivables'
import { ReceivablesClient } from '../recebiveis/client'
import { Skeleton } from '@/components/ui/skeleton'

async function FaturamentoContent() {
  const [receivables, stats] = await Promise.all([
    getReceivables(),
    getReceivablesStats(),
  ])

  return <ReceivablesClient receivables={receivables} stats={stats} isHome />
}

function FaturamentoLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-5 w-[400px]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[100px] w-full" />
      </div>
    </div>
  )
}

export default function FaturamentoPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<FaturamentoLoading />}>
        <FaturamentoContent />
      </Suspense>
    </div>
  )
}

