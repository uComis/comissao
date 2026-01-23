import { Suspense } from 'react'
import { ConfirmarPlanoClient } from './confirmar-client'
import { Skeleton } from '@/components/ui/skeleton'

function ConfirmarLoading() {
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <Skeleton className="h-8 w-[300px]" />
      <Skeleton className="h-4 w-[400px]" />
      <div className="space-y-4 pt-8">
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  )
}

export default function ConfirmarPlanoPage() {
  return (
    <Suspense fallback={<ConfirmarLoading />}>
      <ConfirmarPlanoClient />
    </Suspense>
  )
}
