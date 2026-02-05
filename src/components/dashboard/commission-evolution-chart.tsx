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
import { formatCurrency } from '@/lib/utils'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CommissionEvolutionChartProps {
  title: string
  description: string
  data: Array<Record<string, string | number>>
  names: string[]
}

const COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ef4444', // Red
]

export function CommissionEvolutionChart({ title, description, data, names }: CommissionEvolutionChartProps) {
  // Fill missing values with 0 so lines rise from baseline instead of appearing "cut"
  const normalizedData = data.map((entry) => {
    const normalized = { ...entry }
    for (const name of names) {
      if (normalized[name] === undefined || normalized[name] === null) {
        normalized[name] = 0
      }
    }
    return normalized
  })

  // Build chart config dynamically
  const chartConfig = names.reduce((acc, name, index) => {
    acc[name] = {
      label: name,
      color: COLORS[index % COLORS.length],
    }
    return acc
  }, {} as ChartConfig)

  return (
    <Card className="border-none shadow-sm h-full flex flex-col bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Filter className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 pt-0 mt-4">
        <ChartContainer config={chartConfig} className="h-full w-full min-h-[250px]">
          <AreaChart data={normalizedData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
            <defs>
              {names.map((name, index) => (
                <linearGradient key={name} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              className="text-[10px] font-medium text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tickFormatter={(value) => `R$ ${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
              className="text-[10px] font-medium text-muted-foreground"
            />
            <ChartTooltip 
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                content={<ChartTooltipContent 
                    hideLabel={false}
                    formatter={(value) => formatCurrency(Number(value))}
                />} 
            />
            <ChartLegend content={<ChartLegendContent className="flex-wrap justify-center !overflow-visible" />} />
            
            {names.map((name, index) => (
              <Area
                key={name}
                type="monotone"
                dataKey={name}
                stroke={COLORS[index % COLORS.length]}
                fillOpacity={1}
                fill={`url(#color-${index})`}
                strokeWidth={2}
                dot={{ r: 0 }}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
