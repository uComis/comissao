'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import type { CommissionSummary } from '@/types'

type Props = {
  data: CommissionSummary[]
  loading?: boolean
}

const chartConfig = {
  bruto: {
    label: 'Bruto',
    color: 'var(--chart-1)',
  },
  liquido: {
    label: 'Líquido',
    color: 'var(--chart-2)',
  },
  comissao: {
    label: 'Comissão',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`
  }
  return `R$ ${value.toFixed(0)}`
}

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date)
}

export function EvolutionChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    name: formatPeriodLabel(d.period),
    bruto: d.total_gross_value,
    liquido: d.total_net_value,
    comissao: d.total_commission,
  }))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução</CardTitle>
          <CardDescription>Sem dados disponíveis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Nenhum dado para exibir
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução</CardTitle>
        <CardDescription>Comparativo dos últimos meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickFormatter={formatCurrency} tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(Number(value))}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="bruto"
              stroke="var(--color-bruto)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--color-bruto)' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="liquido"
              stroke="var(--color-liquido)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--color-liquido)' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="comissao"
              stroke="var(--color-comissao)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--color-comissao)' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
