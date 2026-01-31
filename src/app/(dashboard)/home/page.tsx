'use client'

import { StatCard, RankingCard, CommissionEvolutionChart } from "@/components/dashboard"
import { useHeaderActions } from "@/components/layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect, useCallback } from 'react'
import { getHomeAnalyticsAction } from '@/app/actions/dashboard'
import { HomeDashboardData } from '@/lib/services/dashboard-service'
import { GoalDialog } from '@/components/dashboard/goal-dialog'
import { formatCurrency } from '@/lib/utils'
import { 
  Target,
  ShoppingCart,
  DollarSign,
  HandCoins
} from "lucide-react"


export default function AnalyticsPage() {
  const [data, setData] = useState<HomeDashboardData | null>(null)
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    // setLoading(true) // Removido pois já inicia como true
    const result = await getHomeAnalyticsAction()
    if (result) {
      setData(result)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useHeaderActions(null)

  if (loading) {
    return (
      <div className="flex flex-col gap-8 items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Carregando dashboard...</p>
      </div>
    )
  }

  const cards = data?.cards
  const rankings = data?.rankings

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto md:px-0">

      <div className="grid gap-4 lg:grid-cols-4 max-w-[600px] lg:max-w-none mx-auto lg:mx-0">
        {/* Grupo da Esquerda: 4 Cards em 2x2 */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <StatCard
            label="Minha Comissão"
            value={formatCurrency(cards?.commission.current || 0)}
            icon={Target}
            valueClassName="truncate max-w-full"
            progress={cards?.commission.progress}
            remainingLabel={cards?.commission.goal && cards.commission.goal > 0 ? (cards.commission.current >= cards.commission.goal ? "Meta atingida!" : `Faltam ${formatCurrency(cards.commission.remaining)}`) : "Defina sua meta"}
            showProgressBar={true}
            onClick={() => setIsGoalDialogOpen(true)}
          />
          <StatCard
            label="Vendas"
            value={formatCurrency(cards?.total_sales.value || 0)}
            icon={DollarSign}
            valueClassName="truncate max-w-full"
            percentage={cards?.total_sales.trend}
            percentageLabel="vs. mês anterior"
          />
          <StatCard
            label="Vendas Realizadas"
            value={cards?.sales_performed.value || 0}
            icon={ShoppingCart}
            percentage={cards?.sales_performed.trend}
            percentageLabel="vs. mês anterior"
          />
          <StatCard
            label="Recebimentos"
            value={formatCurrency(data?.cards.finance.received || 0)}
            icon={HandCoins}
            valueClassName="whitespace-nowrap"
            remainingLabel={data?.cards.finance && (data.cards.finance.pending > 0 || data.cards.finance.overdue > 0) 
              ? `Pendente: ${formatCurrency(data.cards.finance.pending)}${data.cards.finance.overdue > 0 ? ` (+${formatCurrency(data.cards.finance.overdue)} atrasado)` : ''}`
              : "Tudo em dia!"}
            percentage={data?.cards.finance && data.cards.finance.overdue > 0 ? -1 : undefined}
            percentageLabel={data?.cards.finance && data.cards.finance.overdue > 0 ? "Atrasado" : undefined}
          />
        </div>

        {/* <1400px: um card com toggle (Cliente | Pasta) */}
        <div className="lg:col-span-2 min-[1400px]:hidden">
          <Tabs defaultValue="cliente" className="h-full relative">
            <div className="absolute right-3 top-3 z-10">
              <TabsList className="bg-muted/70 border border-border/60 shadow-sm">
                <TabsTrigger
                  value="cliente"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border data-[state=active]:border-primary/60"
                >
                  Cliente
                </TabsTrigger>
                <TabsTrigger
                  value="pasta"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border data-[state=active]:border-primary/60"
                >
                  Pasta
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="cliente" className="h-full">
              <RankingCard
                title="Faturamento por Cliente"
                data={rankings?.clients || []}
                accentColor="#ca8a04"
              />
            </TabsContent>
            <TabsContent value="pasta" className="h-full">
              <RankingCard
                title="Faturamento por Pasta"
                data={rankings?.folders || []}
                accentColor="#2563eb"
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* >=1400px: dois cards na lateral */}
        <div className="hidden min-[1400px]:block">
          <RankingCard
            title="Faturamento por Cliente"
            data={rankings?.clients || []}
            accentColor="#ca8a04"
          />
        </div>
        <div className="hidden min-[1400px]:block">
          <RankingCard
            title="Faturamento por Pasta"
            data={rankings?.folders || []}
            accentColor="#2563eb"
          />
        </div>
      </div>

      {/* Gráficos de Evolução */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-[600px] lg:max-w-none mx-auto lg:mx-0 pb-10">
        <CommissionEvolutionChart 
          title="Comissão por Pasta (6 Meses)"
          description="Histórico das 5 pastas com maior rendimento este mês"
          data={data?.evolution_folders || []}
          names={data?.evolution_names?.folders || []}
        />
        <CommissionEvolutionChart 
          title="Comissão por Cliente (6 Meses)"
          description="Histórico dos 5 clientes com maior rendimento este mês"
          data={data?.evolution_clients || []}
          names={data?.evolution_names?.clients || []}
        />
      </div>

      <GoalDialog 
        open={isGoalDialogOpen}
        onOpenChange={setIsGoalDialogOpen}
        currentGoal={cards?.commission.goal || 0}
        onSuccess={loadData}
      />
    </div>
  )
}
