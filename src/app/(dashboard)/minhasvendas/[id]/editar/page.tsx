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
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      <Skeleton className="h-[600px] w-full" />
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
