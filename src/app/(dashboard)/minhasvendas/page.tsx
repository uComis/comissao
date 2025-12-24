import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getPersonalSales } from '@/app/actions/personal-sales'
import { PersonalSaleTable } from '@/components/sales'
import { Skeleton } from '@/components/ui/skeleton'

async function SalesContent() {
  const sales = await getPersonalSales()
  return <PersonalSaleTable sales={sales} />
}

function SalesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}

export default function MinhasVendasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minhas Vendas</h1>
          <p className="text-muted-foreground">
            Gerencie suas vendas e acompanhe suas comissões
          </p>
        </div>
        <Button asChild>
          <Link href="/minhasvendas/nova">
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Link>
        </Button>
      </div>

      <Suspense fallback={<SalesLoading />}>
        <SalesContent />
      </Suspense>
    </div>
  )
}
