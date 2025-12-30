'use client'

import { Area, AreaChart, ReferenceLine } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

function seededRandom(seed: number) {
  // LCG simples/determinístico: mesmo seed => mesmos valores (SSR e client)
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// Simulando dados do mês de Dezembro (até dia 27) — determinístico para não quebrar hidratação
const rand = seededRandom(202512)
const chartData = Array.from({ length: 27 }, (_, i) => ({
  day: i + 1,
  sales: Math.floor(rand() * 8000) + 2000,
}))

const chartConfig = {
  sales: {
    label: "Vendas do Dia",
    color: "#22c55e",
  },
} satisfies ChartConfig

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export function MonthlyRhythmChart() {
  const total = chartData.reduce((sum, d) => sum + d.sales, 0)
  const avg = chartData.length ? total / chartData.length : 0
  const last7 = chartData.slice(-7).reduce((sum, d) => sum + d.sales, 0)
  const prev7 = chartData.slice(-14, -7).reduce((sum, d) => sum + d.sales, 0)
  const delta7Pct = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : 0
  const today = chartData.at(-1)?.day

  return (
    <Card className="border-none shadow-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground">Ritmo do Mês</CardTitle>
        <CardDescription>Faturamento diário (Dezembro)</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-0 flex flex-col gap-3">
        {/* KPIs rápidos (saúde do ritmo) */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border border-border/50 px-2 py-1.5">
            <div className="text-[10px] text-muted-foreground">Total</div>
            <div className="text-xs font-semibold tabular-nums">{brl.format(total)}</div>
          </div>
          <div className="rounded-md border border-border/50 px-2 py-1.5">
            <div className="text-[10px] text-muted-foreground">Média/dia</div>
            <div className="text-xs font-semibold tabular-nums">{brl.format(Math.round(avg))}</div>
          </div>
          <div className="rounded-md border border-border/50 px-2 py-1.5">
            <div className="text-[10px] text-muted-foreground">7d vs 7d</div>
            <div
              className={[
                'text-xs font-semibold tabular-nums',
                delta7Pct > 0 ? 'text-emerald-600' : '',
                delta7Pct < 0 ? 'text-rose-600' : '',
              ].join(' ')}
            >
              {delta7Pct >= 0 ? '+' : ''}
              {delta7Pct.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Sparkline (batimento diário) */}
        <ChartContainer config={chartConfig} className="h-full w-full min-h-[160px]">
          <AreaChart data={chartData} margin={{ left: 6, right: 6, top: 10, bottom: 0 }}>
            <ReferenceLine
              y={avg}
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
              strokeDasharray="4 4"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const day = payload?.[0]?.payload?.day
                    return day ? `Dia ${day}` : 'Dia'
                  }}
                  formatter={(v) => brl.format(Number(v))}
                />
              }
              cursor={false}
            />
            <defs>
              <linearGradient id="rhythmFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-sales)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--color-sales)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="sales"
              stroke="var(--color-sales)"
              strokeWidth={2}
              fill="url(#rhythmFill)"
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            {/* Ponto do "hoje" (último dia do dataset) */}
            <Area
              type="monotone"
              dataKey={(d: { day: number; sales: number }) => (d.day === today ? d.sales : null)}
              stroke="transparent"
              fill="transparent"
              dot={{ r: 5, fill: "var(--color-sales)" }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

