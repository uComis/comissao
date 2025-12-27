'use client'

import { 
  Layers, 
  CheckSquare, 
  DollarSign, 
  CreditCard, 
  Calendar as CalendarIcon
} from "lucide-react"
import { StatCard, DonutCard } from "@/components/dashboard"
import { Button } from "@/components/ui/button"

const usersData = [
  { name: "New", value: 62, fill: "#f59e0b" },
  { name: "Returning", value: 26, fill: "#fbbf24" },
  { name: "Inactive", value: 12, fill: "#fef3c7" },
]

const subscriptionsData = [
  { name: "Paid", value: 70, fill: "#3b82f6" },
  { name: "Trial", value: 30, fill: "#93c5fd" },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            01.08.2022 - 31.08.2022
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {/* Grupo da Esquerda: 4 Cards em 2x2 */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <StatCard
            label="Orders"
            value={201}
            icon={Layers}
            percentage={8.2}
            percentageLabel="since last month"
          />
          <StatCard
            label="Approved"
            value={36}
            icon={CheckSquare}
            percentage={3.4}
            percentageLabel="since last month"
          />
          <StatCard
            label="Month total"
            value={25410}
            icon={DollarSign}
            percentage={-0.2}
            percentageLabel="since last month"
          />
          <StatCard
            label="Revenue"
            value={1352}
            icon={CreditCard}
            percentage={-1.2}
            percentageLabel="since last month"
          />
        </div>

        <DonutCard
          title="Users"
          value="4.890"
          subtitle="since last month"
          data={usersData}
        />

        <DonutCard
          title="Subscriptions"
          value="1.201"
          subtitle="since last month"
          data={subscriptionsData}
        />
      </div>
    </div>
  )
}
