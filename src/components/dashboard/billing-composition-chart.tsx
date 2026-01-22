'use client'

import { Bar, BarChart, CartesianGrid, XAxis, Cell } from 'recharts'
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

type Props = {
  data?: {
    gross: number
    salesCount: number
    deduction: number
    commission: number
    result: number
    deductionPercent: number
    commissionPercent: number
    resultPercent: number
  }
  loading?: boolean
}

const chartConfig = {
  deduction: {
    label: 'Dedução',
    color: 'rgb(239 68 68)', // red-500
  },
  commission: {
    label: 'Comissão',
    color: 'rgb(16 185 129)', // emerald-500
  },
  result: {
    label: 'Resultado',
    color: 'rgb(59 130 246)', // blue-500
  },
} satisfies ChartConfig

export function BillingCompositionChart({ data, loading }: Props) {
  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Composição do Faturamento</CardTitle>
          <CardDescription>
            Distribuição do valor bruto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const chartData = [
    {
      name: 'Dedução',
      value: data.deduction,
      percent: data.deductionPercent,
      fill: 'var(--color-deduction)',
    },
    {
      name: 'Comissão',
      value: data.commission,
      percent: data.commissionPercent,
      fill: 'var(--color-commission)',
    },
    {
      name: 'Resultado',
      value: data.result,
      percent: data.resultPercent,
      fill: 'var(--color-result)',
    },
  ]

  const formattedGross = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(data.gross)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Composição do Faturamento</CardTitle>
        <CardDescription>
          Total: <span className="font-medium text-foreground">{formattedGross}</span> ({data.salesCount} vendas)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                     // Find the corresponding item in chartData to get percent
                     const percent = item.payload.percent
                     return (
                        <>
                           <div
                              className="h-2.5 w-2.5 rounded-[2px]"
                              style={{ backgroundColor: item.color }}
                           />
                           <div className="flex min-w-[130px] items-center text-xs text-muted-foreground">
                              {name}
                              <div className="ml-auto flex items-baseline gap-0.5 font-medium text-foreground">
                                 {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                 }).format(Number(value))}
                                 <span className="font-normal text-muted-foreground">
                                    ({percent.toFixed(1)}%)
                                 </span>
                              </div>
                           </div>
                        </>
                     )
                  }}
                />
              }
              cursor={false}
            />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
            >
             {
                chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))
             }
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

