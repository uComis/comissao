'use client'

import { StatCard, RankingCard, CommissionEvolutionChart } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, Target, DollarSign, ShoppingCart, HandCoins } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const SAMPLE_RANKINGS = {
  clients: [
    { name: 'Cliente Exemplo A', value: 4200 },
    { name: 'Cliente Exemplo B', value: 3100 },
    { name: 'Cliente Exemplo C', value: 2400 },
    { name: 'Cliente Exemplo D', value: 1800 },
    { name: 'Cliente Exemplo E', value: 900 },
  ],
  folders: [
    { name: 'Pasta Exemplo 1', value: 5500 },
    { name: 'Pasta Exemplo 2', value: 3800 },
    { name: 'Pasta Exemplo 3', value: 2100 },
    { name: 'Pasta Exemplo 4', value: 1200 },
    { name: 'Pasta Exemplo 5', value: 600 },
  ],
}

const SAMPLE_EVOLUTION = [
  { month: 'Set', 'Exemplo A': 800, 'Exemplo B': 600 },
  { month: 'Out', 'Exemplo A': 1200, 'Exemplo B': 900 },
  { month: 'Nov', 'Exemplo A': 950, 'Exemplo B': 1100 },
  { month: 'Dez', 'Exemplo A': 1400, 'Exemplo B': 800 },
  { month: 'Jan', 'Exemplo A': 1100, 'Exemplo B': 1300 },
  { month: 'Fev', 'Exemplo A': 1600, 'Exemplo B': 1500 },
]

function EmptyOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/70 backdrop-blur-[2px] rounded-lg">
      <p className="text-sm font-medium text-muted-foreground">Sem dados ainda</p>
    </div>
  )
}

export function HomeEmptyState() {
  return (
    <div className="space-y-8 max-w-[1500px] mx-auto md:px-0">
      {/* CTA Banner */}
      <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/30 p-6 md:p-8">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <PlusCircle className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Cadastre sua primeira venda</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Seu dashboard ganha vida quando você registra vendas.
              Comissões, rankings e gráficos aparecem automaticamente.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/minhasvendas/nova">
              <PlusCircle className="mr-2 h-4 w-4" />
              Lançar Primeira Venda
            </Link>
          </Button>
        </div>
      </Card>

      {/* Stats - show real components with zero values, no overlay needed */}
      <div className="grid gap-4 lg:grid-cols-4 max-w-[600px] lg:max-w-none mx-auto lg:mx-0">
        <div className="grid grid-cols-2 gap-2 md:gap-4 lg:col-span-2 opacity-50 pointer-events-none">
          <StatCard label="Minha Comissão" value="R$ 0,00" icon={Target} remainingLabel="Defina sua meta" showProgressBar progress={0} />
          <StatCard label="Vendas" value="R$ 0,00" icon={DollarSign} />
          <StatCard label="Vendas Realizadas" value={0} icon={ShoppingCart} />
          <StatCard label="Recebimentos" value="R$ 0,00" icon={HandCoins} remainingLabel="Tudo em dia!" />
        </div>

        {/* Rankings with overlay - <1400px */}
        <div className="lg:col-span-2 min-[1400px]:hidden relative">
          <EmptyOverlay />
          <div className="opacity-40 pointer-events-none">
            <Tabs defaultValue="cliente" className="h-full relative">
              <div className="absolute right-3 top-3 z-[5]">
                <TabsList className="bg-muted/70 border border-border/60 shadow-sm">
                  <TabsTrigger value="cliente">Cliente</TabsTrigger>
                  <TabsTrigger value="pasta">Pasta</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="cliente" className="h-full">
                <RankingCard title="Faturamento por Cliente" data={SAMPLE_RANKINGS.clients} accentColor="#ca8a04" />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Rankings with overlay - >=1400px */}
        <div className="hidden min-[1400px]:block relative">
          <EmptyOverlay />
          <div className="opacity-40 pointer-events-none">
            <RankingCard title="Faturamento por Cliente" data={SAMPLE_RANKINGS.clients} accentColor="#ca8a04" />
          </div>
        </div>
        <div className="hidden min-[1400px]:block relative">
          <EmptyOverlay />
          <div className="opacity-40 pointer-events-none">
            <RankingCard title="Faturamento por Pasta" data={SAMPLE_RANKINGS.folders} accentColor="#2563eb" />
          </div>
        </div>
      </div>

      {/* Charts with overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-[600px] lg:max-w-none mx-auto lg:mx-0 pb-10">
        <div className="relative">
          <EmptyOverlay />
          <div className="opacity-40 pointer-events-none">
            <CommissionEvolutionChart
              title="Comissão por Pasta (6 Meses)"
              description="Histórico das 5 pastas com maior rendimento"
              data={SAMPLE_EVOLUTION}
              names={['Exemplo A', 'Exemplo B']}
            />
          </div>
        </div>
        <div className="relative">
          <EmptyOverlay />
          <div className="opacity-40 pointer-events-none">
            <CommissionEvolutionChart
              title="Comissão por Cliente (6 Meses)"
              description="Histórico dos 5 clientes com maior rendimento"
              data={SAMPLE_EVOLUTION}
              names={['Exemplo A', 'Exemplo B']}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
