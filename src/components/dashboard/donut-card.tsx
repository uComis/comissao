'use client'

import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Pie, PieChart, Cell } from 'recharts'

type DonutDataItem = {
  name: string
  value: number
  fill: string
}

type DonutCardProps = {
  title: string
  value: string | number
  subtitle?: string
  data: DonutDataItem[]
}

export function DonutCard({ title, value, data }: DonutCardProps) {
  // Gera chartConfig dinamicamente a partir do data
  const chartConfig = data.reduce((acc, item) => {
    acc[item.name.toLowerCase()] = { label: item.name, color: item.fill }
    return acc
  }, {} as ChartConfig)

  // Calcula total para percentuais
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="border-none shadow-sm h-full overflow-hidden flex flex-col py-3 md:py-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6">
        <CardTitle className="text-sm md:text-base font-semibold">
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="px-3 md:px-6 flex-1 flex flex-col">
        {/* Valor idêntico ao StatCard */}
        <div className="text-2xl md:text-4xl font-bold truncate">
          {value}
        </div>

        {/* Área Visual Compacta */}
        <div className="flex-1 flex items-center justify-between mt-4">
          {/* Legendas mais próximas */}
          <div className="flex flex-col gap-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="h-1.5 w-1.5 rounded-full shrink-0" 
                  style={{ backgroundColor: item.fill }} 
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold leading-none">
                    {Math.round((item.value / total) * 100)}%
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase truncate max-w-[100px] leading-none">
                    {item.name}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Donut Chart (Mantendo o estilo que você gostou) */}
          <div className="relative w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 shrink-0">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="75%"
                  outerRadius="100%"
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill} 
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

