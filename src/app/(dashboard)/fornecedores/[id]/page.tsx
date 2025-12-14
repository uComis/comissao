import { getPersonalSupplierWithRule } from '@/app/actions/personal-suppliers'
import { getProductsBySupplier } from '@/app/actions/products'
import { SupplierFormPage } from '../_components/supplier-form-page'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditarFornecedorPage({ params }: Props) {
  const { id } = await params
  
  const [supplier, products] = await Promise.all([
    getPersonalSupplierWithRule(id),
    getProductsBySupplier(id),
  ])

  if (!supplier) {
    notFound()
  }

  return <SupplierFormPage supplier={supplier} products={products} />
}

