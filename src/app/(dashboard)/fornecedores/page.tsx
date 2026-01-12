import { Suspense } from 'react'
import { getPersonalSuppliers } from '@/app/actions/personal-suppliers'
import { FornecedoresClient } from './client'
import { Skeleton } from '@/components/ui/skeleton'

async function FornecedoresContent() {
  const suppliers = await getPersonalSuppliers()
  return <FornecedoresClient initialSuppliers={suppliers} />
}

function FornecedoresLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
        <Skeleton className="h-10 w-[150px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}

export default function FornecedoresPage() {
  return (
    <Suspense fallback={<FornecedoresLoading />}>
      <FornecedoresContent />
    </Suspense>
  )
}
