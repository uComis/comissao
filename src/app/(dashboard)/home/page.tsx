'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Layers, 
  CheckSquare, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Calendar as CalendarIcon
} from "lucide-react"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Pie, PieChart, Cell } from "recharts"
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

const chartConfig = {
  new: { label: "New", color: "#f59e0b" },
  returning: { label: "Returning", color: "#fbbf24" },
  inactive: { label: "Inactive", color: "#fef3c7" },
  paid: { label: "Paid", color: "#3b82f6" },
  trial: { label: "Trial", color: "#93c5fd" },
} satisfies ChartConfig

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
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
        <div className="grid gap-4 md:grid-cols-2 lg:col-span-2">
          <Card className="border-none shadow-sm h-fit">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
              <Layers className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">201</div>
              <div className="flex items-center gap-1 mt-2">
                <span className="flex items-center text-sm font-medium text-green-500">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  8.2%
                </span>
                <span className="text-xs text-muted-foreground">since last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm h-fit">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              <CheckSquare className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">36</div>
              <div className="flex items-center gap-1 mt-2">
                <span className="flex items-center text-sm font-medium text-green-500">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  3.4%
                </span>
                <span className="text-xs text-muted-foreground">since last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm h-fit">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Month total</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">25410</div>
              <div className="flex items-center gap-1 mt-2">
                <span className="flex items-center text-sm font-medium text-red-500">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  0.2%
                </span>
                <span className="text-xs text-muted-foreground">since last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm h-fit">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">1352</div>
              <div className="flex items-center gap-1 mt-2">
                <span className="flex items-center text-sm font-medium text-red-500">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  1.2%
                </span>
                <span className="text-xs text-muted-foreground">since last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card de Users */}
        <Card className="border-none shadow-sm h-full">
          <CardContent className="flex items-start justify-between gap-4 p-4 md:p-6 pb-6 h-full">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold">Users</CardTitle>
              <div className="text-3xl md:text-4xl font-bold pt-1">4.890</div>
              <p className="text-sm text-muted-foreground">since last month</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#f59e0b]" />
                  <span className="text-xs font-medium">62% New</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#fbbf24]" />
                  <span className="text-xs font-medium">26% Returning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#fef3c7]" />
                  <span className="text-xs font-medium">12% Inactive</span>
                </div>
              </div>
            </div>
            <div className="w-[120px] h-[120px] min-w-[120px] md:w-[140px] md:h-[140px] md:min-w-[140px] lg:w-[160px] lg:h-[160px] lg:min-w-[160px] flex-shrink-0 self-end">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={usersData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="60%"
                    outerRadius="90%"
                    strokeWidth={0}
                  >
                    {usersData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Card de Subscriptions */}
        <Card className="border-none shadow-sm h-full">
          <CardContent className="flex items-start justify-between gap-4 p-4 md:p-6 pb-6 h-full">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold">Subscriptions</CardTitle>
              <div className="text-3xl md:text-4xl font-bold pt-1">1.201</div>
              <p className="text-sm text-muted-foreground">since last month</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#3b82f6]" />
                  <span className="text-xs font-medium">70% Paid</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#93c5fd]" />
                  <span className="text-xs font-medium">30% Trial</span>
                </div>
              </div>
            </div>
            <div className="w-[120px] h-[120px] min-w-[120px] md:w-[140px] md:h-[140px] md:min-w-[140px] lg:w-[160px] lg:h-[160px] lg:min-w-[160px] flex-shrink-0 self-end">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={subscriptionsData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="60%"
                    outerRadius="90%"
                    strokeWidth={0}
                  >
                    {subscriptionsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
