import { Suspense } from 'react'
import { getPersonalClients } from '@/app/actions/personal-clients'
import { ClientesClient } from './client'
import { Skeleton } from '@/components/ui/skeleton'

async function ClientesContent() {
  const clients = await getPersonalClients()
  return <ClientesClient initialClients={clients} />
}

function ClientesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <Skeleton className="h-10 w-[140px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}

export default function ClientesPage() {
  return (
    <Suspense fallback={<ClientesLoading />}>
      <ClientesContent />
    </Suspense>
  )
}
