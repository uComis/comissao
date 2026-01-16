import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Pencil } from 'lucide-react'
import { getPersonalSaleById } from '@/app/actions/personal-sales'
import { getReceivables } from '@/app/actions/receivables'
import { ReceivablesCard } from '@/components/sales'
import { PageHeader } from '@/components/layout'

type Props = {
  params: Promise<{ id: string }>
}

function formatCurrency(value: number | null): string {
  if (value === null) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr + 'T00:00:00'))
}

function formatDateWithWeekday(dateStr: string | null): string {
  if (!dateStr) return '-'
  
  const date = new Date(dateStr + 'T00:00:00')
  const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  
  const weekday = weekdays[date.getDay()]
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  
  return `${weekday}, ${day} de ${month} ${year}`
}

function formatPaymentCondition(condition: string | null): string {
  if (!condition || condition.trim() === '') {
    return 'À vista'
  }

  const parts = condition.split('/').map(p => parseInt(p.trim())).filter(n => !isNaN(n))
  
  if (parts.length === 0) {
    return 'À vista'
  }

  if (parts.length === 1) {
    return `${parts[0]} dias`
  }

  // Detectar intervalo uniforme
  const interval = parts[1] - parts[0]
  const isUniform = parts.every((val, i) => i === 0 || val - parts[i - 1] === interval)

  if (isUniform && interval > 0) {
    return `${parts.length}x a cada ${interval} dias`
  }

  // Fallback: mostrar primeiros 3 + ...
  if (parts.length > 3) {
    return `${parts.slice(0, 3).join('/')}...`
  }

  return condition
}

async function VendaDetalheContent({ id }: { id: string }) {
  const sale = await getPersonalSaleById(id)

  if (!sale) {
    notFound()
  }

  // Buscar recebíveis desta venda para calcular status
  const allReceivables = await getReceivables()
  const saleReceivables = allReceivables.filter(r => r.personal_sale_id === id)
  
  const totalReceived = saleReceivables
    .filter(r => r.status === 'received')
    .reduce((sum, r) => sum + (r.received_amount || 0), 0)
  
  const totalOverdue = saleReceivables
    .filter(r => r.status === 'overdue')
    .reduce((sum, r) => sum + (r.expected_commission || 0), 0)
  
  const totalDue = saleReceivables
    .filter(r => r.status === 'pending' || r.status === 'overdue')
    .reduce((sum, r) => sum + (r.expected_commission || 0), 0)

  // Calcular data da primeira parcela
  const firstInstallment = saleReceivables.length > 0
    ? saleReceivables.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]
    : null

  // Verificar se há itens detalhados ou apenas valor agregado
  const hasDetailedItems = (() => {
    if (!sale.items || sale.items.length === 0) return false
    
    // Verificar se TODOS os itens são valores agregados
    // Um item é valor agregado se: product_name === 'Valor' E não tem product_id
    const allItemsAreAggregated = sale.items.every(item => 
      item.product_name === 'Valor' && !item.product_id
    )
    
    // Se todos são valores agregados, não é detalhado
    return !allItemsAreAggregated
  })()
  
  const itemsTitle = hasDetailedItems ? 'Itens da Venda' : 'Valores da Venda'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/minhasvendas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <PageHeader 
            title="Detalhes da Venda" 
            description={`${sale.client_name} - ${formatDate(sale.sale_date)}`}
          >
            <Button asChild>
              <Link href={`/minhasvendas/${id}/editar`}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
          </PageHeader>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Coluna Esquerda (maior) */}
        <div className="space-y-6">
          {/* Itens da Venda / Valores da Venda */}
          <Card>
            <CardHeader>
              <CardTitle>{itemsTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              {hasDetailedItems ? (
                // Tabela para venda detalhada: preço, quantidade, taxa, comissão, total
                <Table className="border-0">
                    <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Taxa</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.items && sale.items.length > 0 ? (
                      sale.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell className="font-mono">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell className="font-mono">{item.quantity}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{formatCurrency(item.tax_amount)}</span>
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs px-1.5 py-0">
                                {item.tax_rate?.toFixed(2) || '0.00'}%
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-green-600">{formatCurrency(item.commission_value)}</span>
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs px-1.5 py-0">
                                {item.commission_rate?.toFixed(2) || '0.00'}%
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatCurrency(item.total_price)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhum item cadastrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              ) : (
                // Tabela para valores agregados: valor, taxa, comissão
                <Table className="border-0">
                    <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Valor</TableHead>
                      <TableHead className="text-center">Taxa</TableHead>
                      <TableHead className="text-center">Comissão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.items && sale.items.length > 0 ? (
                      sale.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-center font-mono">
                            {formatCurrency(item.total_price)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-mono">{formatCurrency(item.tax_amount)}</span>
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs px-1.5 py-0">
                                {item.tax_rate?.toFixed(2) || '0.00'}%
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-mono text-green-600">{formatCurrency(item.commission_value)}</span>
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs px-1.5 py-0">
                                {item.commission_rate?.toFixed(2) || '0.00'}%
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Nenhum item cadastrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recebimentos */}
          <ReceivablesCard
            saleDate={sale.sale_date || new Date().toISOString().split('T')[0]}
            paymentCondition={sale.payment_condition}
            totalValue={sale.gross_value || 0}
            commissionValue={sale.commission_value || 0}
            commissionRate={sale.commission_rate || 0}
          />
        </div>

        {/* Coluna Direita (menor) */}
        <div className="space-y-6">
          {/* Informações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fornecedor</p>
                  <p className="font-medium">{sale.supplier?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{sale.client_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data da Venda</p>
                  <p className="font-medium">{formatDateWithWeekday(sale.sale_date)}</p>
                </div>
                {firstInstallment && (
                  <div>
                    <p className="text-sm text-muted-foreground">Primeira Parcela</p>
                    <p className="font-medium">{formatDateWithWeekday(firstInstallment.due_date)}</p>
                  </div>
                )}
              </div>
              {sale.notes && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-sm mt-1">{sale.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Valores */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Comissão em destaque */}
                <div className="pb-4 border-b">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">
                        Sua Comissão
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {sale.commission_rate?.toFixed(2) || 0}% de comissão
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xl font-bold text-green-600">
                        {formatCurrency(sale.commission_value)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Valores auxiliares */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valor Bruto</span>
                    <span className="font-mono text-sm">{formatCurrency(sale.gross_value)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valor Líquido</span>
                    <span className="font-mono text-sm">{formatCurrency(sale.net_value)}</span>
                  </div>
                </div>

                {/* Status */}
                {saleReceivables.length > 0 && (
                  <div className="pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Recebido</span>
                      <span className="font-mono text-sm text-green-600 font-semibold">
                        {formatCurrency(totalReceived)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Atrasado</span>
                      <span className="font-mono text-sm text-red-600 font-semibold">
                        {formatCurrency(totalOverdue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Devido</span>
                      <span className="font-mono text-sm font-semibold">
                        {formatCurrency(totalDue)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function VendaDetalheLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
      <Skeleton className="h-[300px] w-full" />
    </div>
  )
}

export default async function VendaDetalhePage({ params }: Props) {
  const { id } = await params

  return (
    <Suspense fallback={<VendaDetalheLoading />}>
      <VendaDetalheContent id={id} />
    </Suspense>
  )
}
