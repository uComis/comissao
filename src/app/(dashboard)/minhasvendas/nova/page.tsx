import { Suspense } from 'react'
import { getPersonalSuppliers } from '@/app/actions/personal-suppliers'
import { getProductsBySupplier } from '@/app/actions/products'
import { Skeleton } from '@/components/ui/skeleton'
import { FadeIn } from '@/components/ui/fade-in'
import { NovaVendaShell } from './shell'

async function NovaVendaContent() {
  const suppliers = await getPersonalSuppliers()

  // Buscar produtos de cada fornecedor
  const productsBySupplier: Record<string, Awaited<ReturnType<typeof getProductsBySupplier>>> = {}

  for (const supplier of suppliers) {
    productsBySupplier[supplier.id] = await getProductsBySupplier(supplier.id)
  }

  return (
    <FadeIn>
      <NovaVendaShell
        suppliers={suppliers}
        productsBySupplier={productsBySupplier}
      />
    </FadeIn>
  )
}

function NovaVendaLoading() {
  return (
    <div className="mx-auto max-w-2xl mt-2">
      {/* Mobile skeleton */}
      <div className="md:hidden space-y-6 px-1">
        {/* Identificação */}
        <div className="space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        {/* Valores */}
        <div className="space-y-3">
          <Skeleton className="h-3 w-14" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-md" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        </div>
        {/* Condição de pagamento */}
        <div className="space-y-3">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        {/* Observações */}
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-20 w-full rounded-md" />
        </div>
      </div>

      {/* Desktop skeleton — Card with sections */}
      <div className="hidden md:block rounded-xl border border-border/60 shadow-sm overflow-hidden">
        <div className="divide-y divide-border/40">
          {/* Identificação */}
          <div className="px-6 py-4 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          {/* Valores */}
          <div className="px-6 py-4 space-y-3">
            <Skeleton className="h-3 w-14" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-md" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          </div>
          {/* Condição de pagamento */}
          <div className="px-6 py-4 space-y-3">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-10 w-full rounded-md" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
          {/* Observações */}
          <div className="px-6 py-4 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NovaVendaPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<NovaVendaLoading />}>
        <NovaVendaContent />
      </Suspense>
    </div>
  )
}
