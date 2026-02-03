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
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
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
