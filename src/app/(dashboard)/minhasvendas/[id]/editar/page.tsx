import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getPersonalSaleById } from '@/app/actions/personal-sales'
import { getPersonalSuppliers } from '@/app/actions/personal-suppliers'
import { getProductsBySupplier } from '@/app/actions/products'
import { Skeleton } from '@/components/ui/skeleton'
import { FadeIn } from '@/components/ui/fade-in'
import { EditarVendaShell } from './shell'

type Props = {
  params: Promise<{ id: string }>
}

async function EditarVendaContent({ id }: { id: string }) {
  const sale = await getPersonalSaleById(id)

  if (!sale) {
    notFound()
  }

  const suppliers = await getPersonalSuppliers()

  // Buscar produtos de cada fornecedor
  const productsBySupplier: Record<string, Awaited<ReturnType<typeof getProductsBySupplier>>> = {}

  for (const supplier of suppliers) {
    productsBySupplier[supplier.id] = await getProductsBySupplier(supplier.id)
  }

  return (
    <FadeIn>
      <EditarVendaShell
        suppliers={suppliers}
        productsBySupplier={productsBySupplier}
        sale={sale}
        backHref={`/minhasvendas/${id}`}
      />
    </FadeIn>
  )
}

function EditarVendaLoading() {
  return (
    <div className="mx-auto max-w-2xl mt-5">
      {/* Mobile skeleton */}
      <div className="md:hidden space-y-6 px-1">
        {/* Identificação */}
        <div className="space-y-3">
          <Skeleton className="h-3 w-28" />
          <div className="space-y-3 mt-2">
            <Skeleton className="h-[58px] w-full rounded-xl border-2 border-transparent" />
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
          {/* Item existente */}
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl border-2 border-dashed border-border/40" />
          {/* Totais */}
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-dashed border-border/60">
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-2.5 w-28" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </div>
        {/* Pagamento */}
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
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

      {/* Desktop skeleton */}
      <div className="hidden md:block rounded-xl border border-border/60 shadow-sm overflow-hidden bg-card">
        {/* Identificação */}
        <div className="px-6 py-5 space-y-4">
          <Skeleton className="h-3 w-28" />
          <div className="space-y-3 mt-2">
            <Skeleton className="h-[58px] w-full rounded-xl border-2 border-transparent" />
            <div className="flex justify-end">
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-[58px] w-full rounded-xl border-2 border-transparent" />
          </div>
        </div>
        {/* Valores */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
          {/* Item existente */}
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl border-2 border-dashed border-border/40" />
          {/* Totais */}
          <div className="pt-2 space-y-4">
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-dashed border-border/60">
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-2.5 w-28" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </div>
        {/* Pagamento */}
        <div className="px-6 py-5 space-y-4">
          <Skeleton className="h-3 w-24" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
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

export default async function EditarVendaPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <Suspense fallback={<EditarVendaLoading />}>
        <EditarVendaContent id={id} />
      </Suspense>
    </div>
  )
}
