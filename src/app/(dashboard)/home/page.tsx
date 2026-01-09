'use client'

import { 
  Layers, 
  CheckSquare, 
  DollarSign, 
  Wallet, 
  Calendar as CalendarIcon
} from "lucide-react"
import { StatCard, RankingCard, MonthlyEvolutionChart, PaymentPipelineChart, MonthlyRhythmChart } from "@/components/dashboard"
import { PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect, useCallback } from 'react'
import { getPerformanceStats } from '@/app/actions/user-preferences'
import { GoalDialog } from '@/components/dashboard/goal-dialog'
import { formatCurrency } from '@/lib/utils'

const clientsData = [
  { name: "Cliente VIP", value: 110000, fill: "#f59e0b" },
  { name: "Cliente Varejo", value: 3000, fill: "#fbbf24" },
  { name: "Outros", value: 45400, fill: "#fef3c7" },
]

const foldersData = [
  { name: "Pasta Principal", value: 100000, fill: "#3b82f6" },
  { name: "Pasta Secundária", value: 40000, fill: "#93c5fd" },
  { name: "Outras", value: 18400, fill: "#bfdbfe" },
]

export default function AnalyticsPage() {
  const [stats, setStats] = useState<{
    currentMonthCommission: number
    goal: number
    monthName: string
  } | null>(null)
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)

  const fetchStats = useCallback(async () => {
    const data = await getPerformanceStats()
    if (data) {
      setStats(data)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const goal = stats?.goal || 0
  const current = stats?.currentMonthCommission || 0
  const progress = goal > 0 ? (current / goal) * 100 : 0
  const remaining = Math.max(goal - current, 0)
  const isGoalReached = current >= goal && goal > 0
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
            value={formatCurrency(current)}
            icon={Wallet}
            valueClassName="whitespace-nowrap"
            progress={progress}
            remainingLabel={goal > 0 ? (isGoalReached ? "Meta atingida!" : `Faltam ${formatCurrency(remaining)}`) : "Defina sua meta"}
            showProgressBar={true}
            onClick={() => setIsGoalDialogOpen(true)}
          />
          <StatCard
            label="Vendas Realizadas"
            value={124}
            icon={Layers}
            percentage={8.2}
            percentageLabel="vs. mês anterior"
          />
          <StatCard
            label="Vendas Pagas"
            value={89}
            icon={CheckSquare}
            percentage={3.4}
            percentageLabel="vs. mês anterior"
          />
          <StatCard
            label="Total em Vendas"
            value="R$ 158.400"
            icon={DollarSign}
            valueClassName="whitespace-nowrap"
            percentage={-0.2}
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
                data={clientsData}
              />
            </TabsContent>
            <TabsContent value="pasta" className="h-full">
              <RankingCard
                title="Faturamento por Pasta"
                data={foldersData}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* >=1400px: dois cards na lateral */}
        <div className="hidden min-[1400px]:block">
          <RankingCard
            title="Faturamento por Cliente"
            data={clientsData}
          />
        </div>
        <div className="hidden min-[1400px]:block">
          <RankingCard
            title="Faturamento por Pasta"
            data={foldersData}
          />
        </div>
      </div>

      {/* Cards Secundários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-[1500px]:grid-cols-4 max-w-[600px] lg:max-w-none mx-auto lg:mx-0 pb-10">
        <MonthlyEvolutionChart />
        <MonthlyRhythmChart />
        <PaymentPipelineChart />
      </div>

      <GoalDialog 
        open={isGoalDialogOpen}
        onOpenChange={setIsGoalDialogOpen}
        currentGoal={stats?.goal || 0}
        onSuccess={fetchStats}
      />
    </div>
  )
}
