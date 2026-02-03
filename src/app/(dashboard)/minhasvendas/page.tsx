import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Rocket, PlusCircle } from 'lucide-react'
import { getPersonalSales } from '@/app/actions/personal-sales'
import { MinhasVendasActions } from './page-header-setter'
import { MinhasVendasClient } from './minhas-vendas-client'
import { Skeleton } from '@/components/ui/skeleton'
import { FadeIn } from '@/components/ui/fade-in'

async function SalesContent() {
  const sales = await getPersonalSales()

  if (sales.length === 0) {
    return (
      <FadeIn className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
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
      </FadeIn>
    )
  }

  return (
    <FadeIn className="mx-auto max-w-4xl space-y-6">
      <MinhasVendasActions />
      <MinhasVendasClient sales={sales} />
    </FadeIn>
  )
}

function SalesLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
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
