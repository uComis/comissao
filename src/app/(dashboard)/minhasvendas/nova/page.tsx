import { getPersonalSuppliers } from '@/app/actions/personal-suppliers'
import { getProductsBySupplier } from '@/app/actions/products'
import { PersonalSaleForm } from '@/components/sales'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

export default async function NovaVendaPage() {
  const suppliers = (await getPersonalSuppliers()) as any as PersonalSupplierWithRules[]
  
  // Buscar produtos de cada fornecedor
  const productsBySupplier: Record<string, Awaited<ReturnType<typeof getProductsBySupplier>>> = {}
  
  for (const supplier of suppliers) {
    productsBySupplier[supplier.id] = await getProductsBySupplier(supplier.id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nova Venda</h1>
        <p className="text-muted-foreground">
          Registre uma nova venda e calcule a comissão automaticamente
        </p>
      </div>

      <PersonalSaleForm 
        suppliers={suppliers} 
        productsBySupplier={productsBySupplier}
      />
    </div>
  )
}

