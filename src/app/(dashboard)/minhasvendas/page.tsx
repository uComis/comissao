import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Rocket, PlusCircle } from 'lucide-react'
import { getPersonalSales } from '@/app/actions/personal-sales'
import { PersonalSaleTable } from '@/components/sales'
import { PageHeader } from '@/components/layout'
import { Skeleton } from '@/components/ui/skeleton'

async function SalesContent() {
  const sales = await getPersonalSales()

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="rounded-full bg-primary/10 p-8">
          <Rocket className="h-16 w-16 text-primary animate-bounce" />
        </div>
        <div className="text-center space-y-2 max-w-md">
          <h1 className="text-3xl font-bold tracking-tight">Seu Painel de Performance</h1>
          <p className="text-muted-foreground">
            Sua jornada para o topo começa aqui. Assim que você cadastrar suas primeiras vendas, 
            esta tela se transformará em uma central de inteligência para o seu negócio.
          </p>
        </div>
        <Button asChild size="lg" className="px-8">
          <Link href="/minhasvendas/nova">
            <PlusCircle className="mr-2 h-5 w-5" />
            Lançar Minha Primeira Venda
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Minhas Vendas" 
        description="Gerencie suas vendas e acompanhe suas comissões"
      >
        <Button asChild>
          <Link href="/minhasvendas/nova">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Nova Venda</span>
          </Link>
        </Button>
      </PageHeader>
      <PersonalSaleTable sales={sales} />
    </div>
  )
}

function SalesLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <Skeleton className="h-10 w-[120px]" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}

export default function MinhasVendasPage() {
  return (
    <Suspense fallback={<SalesLoading />}>
      <SalesContent />
    </Suspense>
  )
}
