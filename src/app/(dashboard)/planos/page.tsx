import { Suspense } from 'react'
import { PlanosPageClient } from './planos-client'
import { getPlans } from '@/app/actions/billing'
import { Skeleton } from '@/components/ui/skeleton'
import { FadeIn } from '@/components/ui/fade-in'

async function PlanosContent() {
  const plans = await getPlans()
  return <FadeIn><PlanosPageClient initialPlans={plans} /></FadeIn>
}

function PlanosLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  )
}

export default function PlanosPage() {
  return (
    <Suspense fallback={<PlanosLoading />}>
      <PlanosContent />
    </Suspense>
  )
}
