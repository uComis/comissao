import { PlanosPageClient } from './planos-client'
import { getPlans } from '@/app/actions/billing'

export default async function PlanosPage() {
  const plans = await getPlans()
  
  return <PlanosPageClient initialPlans={plans} />
}
