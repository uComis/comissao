'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid 
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
import { getPersonalReportsData, type ReportsData, type ReportFunnel, type ReportClient } from '@/app/actions/personal-reports'
import { format, parseISO } from 'date-fns'
import { PlusCircle, TrendingUp, Users, Package, PieChart as PieChartIcon, Rocket } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
const chartConfig = {
  vendas: {
    label: 'Vendas',
    color: '#3b82f6', // blue-500
  },
  comissao: {
    label: 'Comissão',
    color: '#10b981', // emerald-500
  },
  total: {
    label: 'Total',
    color: '#f59e0b', // amber-500
  },
} satisfies ChartConfig

function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className
}: { 
  icon: React.ElementType, 
  title: string, 
  description: string, 
  action?: { label: string, href: string },
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center h-[300px] border-2 border-dashed rounded-lg bg-muted/10 ${className}`}>
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[300px] mb-6">
        {description}
      </p>
      {action && (
        <Button asChild variant="default">
          <Link href={action.href}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {action.label}
          </Link>
        </Button>
      )}
    </div>
  )
}

export default function PersonalReportsClient() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportsData | null>(null)

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

  const hasSales = data.monthlyEvolution.length > 0
  const hasClients = data.clientABC.length > 0
  const hasProducts = data.productMix.length > 0
  const hasSuppliers = data.supplierRanking.length > 0
  const isMultiSupplier = data.supplierRanking.length > 1
  const singleSupplierName = !isMultiSupplier && hasSuppliers ? data.supplierRanking[0].name : null

  // Tratamento para "Primeiro Mês" - Se houver apenas 1 mês, adicionamos um ponto zero
  // para dar perspectiva de crescimento no gráfico de linha.
  const evolutionData = data.monthlyEvolution.length === 1 
    ? [
        { name: 'Início', vendas: 0, comissao: 0, period: '0' },
        ...data.monthlyEvolution
      ]
    : data.monthlyEvolution

  // Se não tem absolutamente nada, mostra um Welcome State
  if (!hasSales && !hasClients && !hasProducts && !hasSuppliers) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="rounded-full bg-primary/10 p-8">
          <Rocket className="h-16 w-16 text-primary animate-bounce" />
        </div>
        <div className="text-center space-y-2 max-w-md">
          <h1 className="text-3xl font-bold tracking-tight">Seu Painel de Performance</h1>
          <p className="text-muted-foreground">
            Sua jornada para o topo começa aqui. Assim que você cadastrar suas primeiras vendas, 
            esta tela se transformará em uma central de inteligência para o seu negócio.
          </p>
        </div>
        <Button asChild size="lg" className="px-8">
          <Link href="/minhasvendas/nova">
            <PlusCircle className="mr-2 h-5 w-5" />
            Lançar Minha Primeira Venda
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 1. Evolução Mensal (Sempre no topo) */}
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {singleSupplierName ? `Performance: ${singleSupplierName}` : "Evolução Mensal"}
                    </CardTitle>
                    <CardDescription>
                      {singleSupplierName ? "Histórico de vendas e comissões desta pasta" : "Vendas vs Comissão (Últimos 6 meses)"}
                    </CardDescription>
                  </div>
                  {data.monthlyEvolution.length === 1 && (
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-medium text-primary animate-pulse">
                      Primeiro mês ativo
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {hasSales ? (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <LineChart data={evolutionData} accessibilityLayer>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={8}
                      />
                      <YAxis tickFormatter={(v) => `R$ ${v/1000}k`} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="vendas" 
                        stroke="var(--color-vendas)" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: "var(--color-vendas)", strokeWidth: 0 }} 
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="comissao" 
                        stroke="var(--color-comissao)" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: "var(--color-comissao)", strokeWidth: 0 }} 
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <EmptyState 
                    icon={TrendingUp}
                    title="Aguardando Vendas"
                    description="Aqui você verá o crescimento do seu faturamento e comissões mês a mês."
                  />
                )}
              </CardContent>
            </Card>

            {/* 2. Composição de Ganhos (Sempre no topo, ao lado da evolução) */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Composição de Ganhos</CardTitle>
                <CardDescription>Eficiência: Valor vendido vs Comissão gerada</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {hasSales ? (
                  <div className="flex flex-col justify-center h-full space-y-8">
                    {data.commissionFunnel.map((item: ReportFunnel) => (
                      <div key={item.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-muted-foreground">{formatCurrency(item.value)}</span>
                        </div>
                        <div className="h-4 w-full rounded-full bg-secondary overflow-hidden">
                          <div 
                            className="h-full transition-all duration-1000 ease-out"
                            style={{ 
                              width: `${(item.value / data.commissionFunnel[0].value) * 100}%`,
                              backgroundColor: item.name === 'Venda Total' ? chartConfig.vendas.color : 
                                             item.name === 'Comissão Estimada' ? chartConfig.comissao.color : 
                                             chartConfig.total.color
                            }}
                          />
                        </div>
                        {item.name === 'Comissão Estimada' && (
                          <p className="text-[10px] text-muted-foreground text-right italic">
                            Aprox. {((item.value / data.commissionFunnel[0].value) * 100).toFixed(1)}% do total vendido
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    className="border-none bg-transparent"
                    icon={PieChartIcon}
                    title="Funil em branco"
                    description="Acompanhe a conversão do seu esforço de venda em dinheiro no bolso."
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* 3. Ranking Fornecedores (Linha de baixo, só se houver mais de um) */}
          {isMultiSupplier && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Rentabilidade por Pasta</CardTitle>
                <CardDescription>Comparativo de comissão acumulada por fornecedor</CardDescription>
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
          )}
        </TabsContent>

        <TabsContent value="clientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Curva ABC de Clientes</CardTitle>
              <CardDescription>Ranking de clientes por volume de compra</CardDescription>
            </CardHeader>
            <CardContent>
              {hasClients ? (
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
                      {data.clientABC.map((client: ReportClient) => (
                        <tr key={client.name} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle font-medium">{client.name}</td>
                          <td className="p-4 align-middle text-right">{formatCurrency(client.total)}</td>
                          <td className="p-4 align-middle text-right">{client.count}</td>
                          <td className="p-4 align-middle text-right text-muted-foreground">
                            {format(parseISO(client.lastSale), "dd/MM/yyyy")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState 
                  icon={Users}
                  title="Carteira em construção"
                  description="Saiba quem são seus melhores clientes e quem precisa de uma visita."
                />
              )}
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
              {hasProducts ? (
                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                  <BarChart data={data.productMix} layout="vertical" margin={{ left: 50 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={150} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />} />
                    <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <EmptyState 
                  icon={Package}
                  title="Mix de produtos"
                  description="Identifique seus 'carros-chefe' e as oportunidades de venda em todas as suas pastas."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
