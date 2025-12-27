'use client'

import { useEffect, useState, useCallback } from 'react'
import { RadialBar, RadialBarChart, PolarRadiusAxis, Label, PolarAngleAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
} from '@/components/ui/chart'
import { getPerformanceStats } from '@/app/actions/user-preferences'
import { GoalDialog } from './goal-dialog'
import { Target } from 'lucide-react'

const chartConfig = {
  value: {
    label: "Comissão Atual",
  },
} satisfies ChartConfig

export function CommissionGoalChart() {
  const [stats, setStats] = useState<{
    currentMonthCommission: number
    goal: number
    monthName: string
  } | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const data = await getPerformanceStats()
    if (data) {
      setStats(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      const data = await getPerformanceStats()
      if (mounted) {
        if (data) setStats(data)
        setLoading(false)
      }
    }

    loadData()
    return () => { mounted = false }
  }, [fetchData])

  if (loading) {
    return (
      <Card className="border-none shadow-sm h-full flex flex-col animate-pulse">
        <div className="h-full w-full bg-muted/20 rounded-lg" />
      </Card>
    )
  }

  const goal = stats?.goal || 0
  const current = stats?.currentMonthCommission || 0
  const percentage = goal > 0 ? Math.min(Math.round((current / goal) * 100), 100) : 0
  const remaining = Math.max(goal - current, 0)
  const isGoalReached = current >= goal && goal > 0
  const monthName = stats?.monthName || ''
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  return (
    <>
      <Card 
        className="border-none shadow-sm h-full flex flex-col cursor-pointer hover:bg-accent/50 transition-colors group"
        onClick={() => setIsDialogOpen(true)}
      >
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
            Meta {capitalizedMonth}
          </CardTitle>
          <CardDescription>
            Meta: {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(goal)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center p-0">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[200px]">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="80%"
              outerRadius="100%"
              barSize={12}
              data={[{ value: percentage, fill: "#10b981" }]}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                background={{ fill: "rgba(255, 255, 255, 0.1)" }}
                dataKey="value"
                cornerRadius={10}
              />
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {percentage}%
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-xs"
                          >
                            concluído
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </PolarRadiusAxis>
            </RadialBarChart>
          </ChartContainer>
          
          <div className="pb-6 px-6 w-full text-center">
            <p className="text-sm text-muted-foreground">
              {goal > 0 ? (
                isGoalReached ? (
                  <span className="text-green-500 font-medium flex items-center justify-center gap-1">
                    <Target className="h-4 w-4" /> Meta atingida!
                  </span>
                ) : (
                  <>
                    Faltam <span className="font-semibold text-foreground">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(remaining)}
                    </span> para a meta
                  </>
                )
              ) : (
                "Clique para definir sua meta"
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <GoalDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        currentGoal={goal}
        onSuccess={fetchData}
      />
    </>
  )
}

