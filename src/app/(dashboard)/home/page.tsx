'use client'

import { 
  Layers, 
  CheckSquare, 
  DollarSign, 
  Wallet, 
  Calendar as CalendarIcon
} from "lucide-react"
import { StatCard, DonutCard, MonthlyEvolutionChart, PaymentPipelineChart, MonthlyRhythmChart, CommissionGoalChart } from "@/components/dashboard"
import { PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"

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
  return (
    <div className="space-y-8 max-w-[1500px] mx-auto md:px-0">
      <PageHeader title="Analytics">
        <Button variant="outline" className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          01.12.2025 - 27.12.2025
        </Button>
      </PageHeader>

      <div className="grid gap-4 min-[1500px]:grid-cols-4 max-w-[600px] min-[1500px]:max-w-none mx-auto min-[1500px]:mx-0">
        {/* Grupo da Esquerda: 4 Cards em 2x2 */}
        <div className="grid grid-cols-2 gap-4 min-[1500px]:col-span-2">
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
            percentage={-0.2}
            percentageLabel="vs. mês anterior"
          />
          <StatCard
            label="Minha Comissão"
            value="R$ 7.920"
            icon={Wallet}
            percentage={-1.2}
            percentageLabel="vs. mês anterior"
          />
        </div>

        <DonutCard
          title="Faturamento por Cliente"
          value="R$ 158.400"
          data={clientsData}
        />

        <DonutCard
          title="Faturamento por Pasta"
          value="R$ 158.400"
          data={foldersData}
        />
      </div>

      <div className="grid gap-4 min-[1500px]:grid-cols-4 max-w-[600px] min-[1500px]:max-w-none mx-auto min-[1500px]:mx-0 pb-10">
        <MonthlyEvolutionChart />
        <MonthlyRhythmChart />
        <PaymentPipelineChart />
        <CommissionGoalChart />
      </div>
    </div>
  )
}
