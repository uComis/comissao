import { getPersonalSuppliers } from '@/app/actions/personal-suppliers'
import { FornecedoresClient } from './client'

export default async function FornecedoresPage() {
  const suppliers = await getPersonalSuppliers()

  return <FornecedoresClient initialSuppliers={suppliers} />
}
