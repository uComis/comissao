import { Suspense } from 'react'
import { getInvoicesAction } from '@/app/actions/billing'
import { CobrancasClient } from './client'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Minhas Cobranças | uComis',
}

export default async function CobrancasPage() {
  const invoices = await getInvoicesAction()

  return (
    <div className="space-y-6">
      <Suspense fallback={<CobrancasSkeleton />}>
        <CobrancasClient initialInvoices={invoices} />
      </Suspense>
    </div>
  )
}

function CobrancasSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}

