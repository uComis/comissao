import { Suspense } from 'react'
import { getPersonalSuppliers } from '@/app/actions/personal-suppliers'
import { getProductsBySupplier } from '@/app/actions/products'
import { PersonalSaleForm } from '@/components/sales'
import { PageHeader } from '@/components/layout'
import { Skeleton } from '@/components/ui/skeleton'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

async function NovaVendaContent() {
  const suppliers = await getPersonalSuppliers()
  
  // Buscar produtos de cada fornecedor
  const productsBySupplier: Record<string, Awaited<ReturnType<typeof getProductsBySupplier>>> = {}
  
  for (const supplier of suppliers) {
    productsBySupplier[supplier.id] = await getProductsBySupplier(supplier.id)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <PageHeader
          title="Registro de venda"
        />
      </div>
      <PersonalSaleForm
        suppliers={suppliers}
        productsBySupplier={productsBySupplier}
      />
    </div>
  )
}

function NovaVendaLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[400px]" />
      </div>
      <Skeleton className="h-[600px] w-full" />
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

