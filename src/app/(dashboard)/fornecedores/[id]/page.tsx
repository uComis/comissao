import { getPersonalSupplierWithRule } from '@/app/actions/personal-suppliers'
import { SupplierFormPage } from '../_components/supplier-form-page'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditarFornecedorPage({ params }: Props) {
  const { id } = await params
  const supplier = await getPersonalSupplierWithRule(id)

  if (!supplier) {
    notFound()
  }

  return <SupplierFormPage supplier={supplier} />
}

