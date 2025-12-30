'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
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
  { status: "Recebido", value: 125000, fill: "#10b981" },
  { status: "Aguardando", value: 28400, fill: "#f59e0b" },
  { status: "Atrasado", value: 5000, fill: "#ef4444" },
]

const chartConfig = {
  recebido: {
    label: "Recebido",
    color: "#10b981",
  },
  aguardando: {
    label: "Aguardando",
    color: "#f59e0b",
  },
  atrasado: {
    label: "Atrasado",
    color: "#ef4444",
  },
} satisfies ChartConfig

export function PaymentPipelineChart() {
  return (
    <Card className="border-none shadow-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground">Status Financeiro</CardTitle>
        <CardDescription>Onde está o faturamento</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <ChartContainer config={chartConfig} className="h-full w-full min-h-[200px]">
          <BarChart data={chartData} layout="vertical" margin={{ left: -20, right: 20, top: 20, bottom: 0 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted/50" />
            <XAxis 
                type="number" 
                hide 
            />
            <YAxis
              dataKey="status"
              type="category"
              tickLine={false}
              axisLine={false}
              className="text-[10px] font-bold"
              width={80}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]} 
              barSize={32}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

