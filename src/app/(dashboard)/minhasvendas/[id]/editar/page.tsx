import { notFound } from 'next/navigation'
import { getPersonalSaleById } from '@/app/actions/personal-sales'
import { getPersonalSuppliers } from '@/app/actions/personal-suppliers'
import { getProductsBySupplier } from '@/app/actions/products'
import { PersonalSaleForm } from '@/components/sales'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditarVendaPage({ params }: Props) {
  const { id } = await params
  const sale = await getPersonalSaleById(id)

  if (!sale) {
    notFound()
  }

  const suppliers = (await getPersonalSuppliers()) as any as PersonalSupplierWithRules[]

  // Buscar produtos de cada fornecedor
  const productsBySupplier: Record<string, Awaited<ReturnType<typeof getProductsBySupplier>>> = {}

  for (const supplier of suppliers) {
    productsBySupplier[supplier.id] = await getProductsBySupplier(supplier.id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Editar Venda</h1>
        <p className="text-muted-foreground">
          Altere os dados da venda
        </p>
      </div>

      <PersonalSaleForm
        suppliers={suppliers}
        productsBySupplier={productsBySupplier}
        sale={sale}
        mode="edit"
      />
    </div>
  )
}

