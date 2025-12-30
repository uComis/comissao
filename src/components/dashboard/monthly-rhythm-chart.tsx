'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

// Simulando dados do mês de Dezembro (até dia 27)
const chartData = Array.from({ length: 27 }, (_, i) => ({
  day: i + 1,
  sales: Math.floor(Math.random() * 8000) + 2000,
}))

const chartConfig = {
  sales: {
    label: "Vendas do Dia",
    color: "#3b82f6",
  },
} satisfies ChartConfig

export function MonthlyRhythmChart() {
  return (
    <Card className="border-none shadow-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground">Ritmo do Mês</CardTitle>
        <CardDescription>Faturamento diário (Dezembro)</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <ChartContainer config={chartConfig} className="h-full w-full min-h-[200px]">
          <BarChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/50" />
            <XAxis
              dataKey="day"
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
            <ChartTooltip 
                content={<ChartTooltipContent />} 
                cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
            />
            <Bar
              dataKey="sales"
              fill="var(--color-sales)"
              radius={[2, 2, 0, 0]}
              className="hover:opacity-80 transition-opacity"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

