'use client'

import { StatCard, RankingCard, CommissionEvolutionChart } from "@/components/dashboard"
import { PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect, useCallback } from 'react'
import { getHomeAnalyticsAction } from '@/app/actions/dashboard'
import { HomeDashboardData } from '@/lib/services/dashboard-service'
import { GoalDialog } from '@/components/dashboard/goal-dialog'
import { formatCurrency } from '@/lib/utils'
import { 
  Layers, 
  CheckSquare, 
  DollarSign, 
  Wallet, 
  Calendar as CalendarIcon
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
      <PageHeader title="Analytics">
        <Button variant="outline" className="datepicker-trigger flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          01.12.2025 - 27.12.2025
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-4 max-w-[600px] lg:max-w-none mx-auto lg:mx-0">
        {/* Grupo da Esquerda: 4 Cards em 2x2 */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <StatCard
            label="Minha Comissão"
            value={formatCurrency(cards?.commission.current || 0)}
            icon={Wallet}
            valueClassName="whitespace-nowrap"
            progress={cards?.commission.progress}
            remainingLabel={cards?.commission.goal && cards.commission.goal > 0 ? (cards.commission.current >= cards.commission.goal ? "Meta atingida!" : `Faltam ${formatCurrency(cards.commission.remaining)}`) : "Defina sua meta"}
            showProgressBar={true}
            onClick={() => setIsGoalDialogOpen(true)}
          />
          <StatCard
            label="Vendas"
            value={formatCurrency(cards?.total_sales.value || 0)}
            icon={DollarSign}
            valueClassName="whitespace-nowrap"
            percentage={cards?.total_sales.trend}
            percentageLabel="vs. mês anterior"
          />
          <StatCard
            label="Vendas Realizadas"
            value={cards?.sales_performed.value || 0}
            icon={Layers}
            percentage={cards?.sales_performed.trend}
            percentageLabel="vs. mês anterior"
          />
          <StatCard
            label="Vendas Pagas"
            value={cards?.sales_paid.value || 0}
            icon={CheckSquare}
            percentage={cards?.sales_paid.trend}
            percentageLabel="vs. mês anterior"
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
              />
            </TabsContent>
            <TabsContent value="pasta" className="h-full">
              <RankingCard
                title="Faturamento por Pasta"
                data={rankings?.folders || []}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* >=1400px: dois cards na lateral */}
        <div className="hidden min-[1400px]:block">
          <RankingCard
            title="Faturamento por Cliente"
            data={rankings?.clients || []}
          />
        </div>
        <div className="hidden min-[1400px]:block">
          <RankingCard
            title="Faturamento por Pasta"
            data={rankings?.folders || []}
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
