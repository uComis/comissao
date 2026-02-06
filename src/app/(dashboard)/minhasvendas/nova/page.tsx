import { Suspense } from 'react'
import { getPersonalSuppliers } from '@/app/actions/personal-suppliers'
import { getProductsBySupplier } from '@/app/actions/products'
import { getPersonalClients } from '@/app/actions/personal-clients'
import { Skeleton } from '@/components/ui/skeleton'
import { FadeIn } from '@/components/ui/fade-in'
import { NovaVendaShell } from './shell'

async function NovaVendaContent() {
  const [suppliers, clients] = await Promise.all([
    getPersonalSuppliers(),
    getPersonalClients(),
  ])

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
        clients={clients}
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
          <Skeleton className="h-3 w-28" />
          <div className="space-y-3 mt-2">
            {/* SupplierPicker */}
            <Skeleton className="h-[58px] w-full rounded-xl border-2 border-transparent" />
            {/* ClientPicker */}
            <div className="mt-5">
              <Skeleton className="h-[58px] w-full rounded-xl border-2 border-transparent" />
            </div>
          </div>
        </div>
        {/* Valores */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
          {/* DashedActionButton */}
          <Skeleton className="h-12 w-full rounded-xl border-2 border-dashed border-border/40" />
        </div>
        {/* Pagamento */}
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          {/* DashedActionButton */}
          <Skeleton className="h-12 w-full rounded-xl border-2 border-dashed border-border/40" />
        </div>
        {/* Observações */}
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Desktop skeleton — Card with sections */}
      <div className="hidden md:block rounded-xl border border-border/60 shadow-sm overflow-hidden bg-card">
        {/* Identificação */}
        <div className="px-6 py-5 space-y-4">
          <Skeleton className="h-3 w-28" />
          <div className="space-y-3 mt-2">
            {/* SupplierPicker */}
            <Skeleton className="h-[58px] w-full rounded-xl border-2 border-transparent" />
            {/* Switch alinhado à direita */}
            <div className="flex justify-end">
              <Skeleton className="h-4 w-40" />
            </div>
            {/* ClientPicker */}
            <Skeleton className="h-[58px] w-full rounded-xl border-2 border-transparent" />
          </div>
        </div>
        {/* Valores */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
          {/* DashedActionButton */}
          <Skeleton className="h-12 w-full rounded-xl border-2 border-dashed border-border/40" />
        </div>
        {/* Pagamento */}
        <div className="px-6 py-5 space-y-4">
          <Skeleton className="h-3 w-24" />
          {/* DashedActionButton */}
          <Skeleton className="h-12 w-full rounded-xl border-2 border-dashed border-border/40" />
        </div>
        {/* Observações */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between py-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-4" />
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
