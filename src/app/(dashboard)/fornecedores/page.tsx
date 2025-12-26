import { getPersonalSuppliers } from '@/app/actions/personal-suppliers'
import { FornecedoresClient } from './client'

export default async function FornecedoresPage() {
  const suppliers = await getPersonalSuppliers() as any // Cast temporário ou update na action para retornar tipo correto se mudou

  return <FornecedoresClient initialSuppliers={suppliers} />
}
