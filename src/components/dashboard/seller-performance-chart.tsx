'use client'

import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil } from 'lucide-react'
import type { SellerHistoryEntry } from '@/types'

type Props = {
  data: SellerHistoryEntry[]
  periods: string[]
  loading?: boolean
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

function formatCurrency(value: number): string {
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

export function SellerPerformanceChart({ data, periods, loading }: Props) {
  const [customSelection, setCustomSelection] = useState<string[] | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tempSelected, setTempSelected] = useState<string[]>([])

  // Se usuário não customizou, usa Top 5. Senão, usa seleção customizada.
  const selectedSellers = useMemo(() => {
    if (customSelection !== null) {
      return customSelection
    }
    return data.slice(0, 5).map((s) => s.seller_id)
  }, [customSelection, data])

  const setSelectedSellers = (ids: string[]) => {
    setCustomSelection(ids)
  }

  // Cria config dinâmica baseada nos vendedores selecionados
  const chartConfig = useMemo(() => {
    return data
      .filter((s) => selectedSellers.includes(s.seller_id))
      .reduce((acc, seller, index) => {
        acc[seller.seller_name] = {
          label: seller.seller_name,
          color: COLORS[index % COLORS.length],
        }
        return acc
      }, {} as ChartConfig)
  }, [data, selectedSellers])

  // Transforma dados para o formato do Recharts
  const chartData = useMemo(() => {
    return periods.map((period) => {
      const point: Record<string, string | number> = { name: formatPeriodLabel(period) }
      for (const seller of data) {
        if (selectedSellers.includes(seller.seller_id)) {
          const periodData = seller.data.find((d) => d.period === period)
          point[seller.seller_name] = periodData?.commission ?? 0
        }
      }
      return point
    })
  }, [data, periods, selectedSellers])

  const selectedData = data.filter((s) => selectedSellers.includes(s.seller_id))

  function handleOpenDialog() {
    setTempSelected([...selectedSellers])
    setDialogOpen(true)
  }

  function handleToggleSeller(sellerId: string) {
    setTempSelected((prev) =>
      prev.includes(sellerId) ? prev.filter((id) => id !== sellerId) : [...prev, sellerId]
    )
  }

  function handleApply() {
    setSelectedSellers(tempSelected)
    setDialogOpen(false)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Vendedor</CardTitle>
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
          <CardTitle>Desempenho por Vendedor</CardTitle>
          <CardDescription>Evolução de comissões por vendedor</CardDescription>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Desempenho por Vendedor</CardTitle>
            <CardDescription>Top {selectedSellers.length} vendedores por comissão</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleOpenDialog}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Selecionar Vendedores</DialogTitle>
                <DialogDescription>
                  Escolha quais vendedores exibir no gráfico de desempenho.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 max-h-[300px] overflow-y-auto py-4">
                {data.map((seller) => {
                  const total = seller.data.reduce((sum, d) => sum + d.commission, 0)
                  return (
                    <label
                      key={seller.seller_id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-muted p-2 rounded-md"
                    >
                      <Checkbox
                        checked={tempSelected.includes(seller.seller_id)}
                        onCheckedChange={() => handleToggleSeller(seller.seller_id)}
                      />
                      <span className="flex-1">{seller.seller_name}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(total)}
                      </span>
                    </label>
                  )
                })}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleApply} disabled={tempSelected.length === 0}>
                  Aplicar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
                  formatter={(value) =>
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(Number(value))
                  }
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {selectedData.map((seller, index) => (
              <Line
                key={seller.seller_id}
                type="monotone"
                dataKey={seller.seller_name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4, fill: COLORS[index % COLORS.length] }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
