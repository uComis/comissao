'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip 
} from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { formatCurrency } from '@/lib/utils'
import { getPersonalReportsData } from '@/app/actions/personal-reports'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const chartConfig = {
  vendas: {
    label: 'Vendas',
    color: 'hsl(var(--chart-1))',
  },
  comissao: {
    label: 'Comissão',
    color: 'hsl(var(--chart-2))',
  },
  total: {
    label: 'Total',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig

export default function PersonalReportsClient() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getPersonalReportsData()
        setData(result)
      } catch (error) {
        console.error('Erro ao carregar relatórios:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (!data) return <div>Erro ao carregar dados.</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Relatórios de Performance</h1>
        <p className="text-muted-foreground">
          Análise estratégica da sua carteira, fornecedores e resultados.
        </p>
      </div>

      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Evolução Mensal */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Evolução Mensal</CardTitle>
                <CardDescription>Vendas vs Comissão (Últimos 6 meses)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <LineChart data={data.monthlyEvolution} accessibilityLayer>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickFormatter={(v) => `R$ ${v/1000}k`} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="vendas" stroke="var(--color-vendas)" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="comissao" stroke="var(--color-comissao)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Ranking Fornecedores */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Rentabilidade por Pasta</CardTitle>
                <CardDescription>Comissão acumulada por fornecedor</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={data.supplierRanking} layout="vertical" accessibilityLayer margin={{ left: 20 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={100} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />} />
                    <Bar dataKey="comissao" fill="var(--color-comissao)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Funil de Comissão */}
            <Card>
              <CardHeader>
                <CardTitle>Funil de Resultados</CardTitle>
                <CardDescription>Venda Bruta {'->'} Comissão Estimada {'->'} Realizada</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.commissionFunnel}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    >
                      {data.commissionFunnel.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(v) => formatCurrency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Curva ABC de Clientes</CardTitle>
              <CardDescription>Ranking de clientes por volume de compra</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cliente</th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Total Comprado</th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Nº Pedidos</th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Última Venda</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {data.clientABC.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          Nenhum cliente com vendas registrado.
                        </td>
                      </tr>
                    ) : (
                      data.clientABC.map((client: any) => (
                        <tr key={client.name} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle font-medium">{client.name}</td>
                          <td className="p-4 align-middle text-right">{formatCurrency(client.total)}</td>
                          <td className="p-4 align-middle text-right">{client.count}</td>
                          <td className="p-4 align-middle text-right text-muted-foreground">
                            {format(parseISO(client.lastSale), "dd/MM/yyyy")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produtos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Produtos</CardTitle>
              <CardDescription>Produtos que mais geraram receita (Cross-Supplier)</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <BarChart data={data.productMix} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={150} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

