import { getPersonalSuppliers } from '@/app/actions/personal-suppliers'
import { getProductsBySupplier } from '@/app/actions/products'
import { PersonalSaleForm } from '@/components/sales'
import { PageHeader } from '@/components/layout'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

export default async function NovaVendaPage() {
  const suppliers = await getPersonalSuppliers()
  
  // Buscar produtos de cada fornecedor
  const productsBySupplier: Record<string, Awaited<ReturnType<typeof getProductsBySupplier>>> = {}
  
  for (const supplier of suppliers) {
    productsBySupplier[supplier.id] = await getProductsBySupplier(supplier.id)
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Nova Venda" 
        description="Registre uma nova venda e calcule a comissão automaticamente"
      />

      <PersonalSaleForm 
        suppliers={suppliers} 
        productsBySupplier={productsBySupplier}
      />
    </div>
  )
}

