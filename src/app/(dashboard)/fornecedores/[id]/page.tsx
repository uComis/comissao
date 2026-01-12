import { Suspense } from 'react'
import { getPersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import { getProductsBySupplier } from '@/app/actions/products'
import { SupplierFormPage } from '../_components/supplier-form-page'
import { Skeleton } from '@/components/ui/skeleton'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ id: string }>
}

async function EditarFornecedorContent({ id }: { id: string }) {
  const [supplier, products] = await Promise.all([
    getPersonalSupplierWithRules(id),
    getProductsBySupplier(id),
  ])

  if (!supplier) {
    notFound()
  }

  return <SupplierFormPage supplier={supplier} products={products} />
}

function EditarFornecedorLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[350px]" />
      </div>
      <Skeleton className="h-[500px] w-full" />
    </div>
  )
}

export default async function EditarFornecedorPage({ params }: Props) {
  const { id } = await params
  
  return (
    <Suspense fallback={<EditarFornecedorLoading />}>
      <EditarFornecedorContent id={id} />
    </Suspense>
  )
}
