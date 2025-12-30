'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

const chartData = [
  { month: "Jul", sales: 120000, commission: 6000 },
  { month: "Ago", sales: 150000, commission: 8200 },
  { month: "Set", sales: 135000, commission: 7100 },
  { month: "Out", sales: 180000, commission: 10500 },
  { month: "Nov", sales: 160000, commission: 8800 },
  { month: "Dez", sales: 158400, commission: 7920 },
]

const chartConfig = {
  sales: {
    label: "Vendas",
    color: "#3b82f6", // Blue
  },
  commission: {
    label: "Comissão",
    color: "#10b981", // Emerald/Green
  },
} satisfies ChartConfig

export function MonthlyEvolutionChart() {
  return (
    <Card className="border-none shadow-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground">Evolução Mensal</CardTitle>
        <CardDescription>Comparativo Vendas vs. Comissão</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <ChartContainer config={chartConfig} className="h-full w-full min-h-[200px]">
          <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-commission)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-commission)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/50" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-[10px] font-medium"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `R$ ${value / 1000}k`}
              className="text-[10px] font-medium"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="var(--color-sales)"
              fillOpacity={1}
              fill="url(#colorSales)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="commission"
              stroke="var(--color-commission)"
              fillOpacity={1}
              fill="url(#colorCommission)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

