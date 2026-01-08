import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export default async function VendaDetalhePage({ params }: Props) {
  const { id } = await params
  const sale = await getPersonalSaleById(id)

  if (!sale) {
    notFound()
  }

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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <p className="font-medium">{formatDate(sale.sale_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Condição de Pagamento</p>
                <p className="font-medium">{formatPaymentCondition(sale.payment_condition)}</p>
              </div>
            </div>
            {sale.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Observações</p>
                <p className="text-sm mt-1">{sale.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Valor Bruto</span>
                <span className="font-mono text-lg">{formatCurrency(sale.gross_value)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Valor Líquido</span>
                <span className="font-mono text-lg">{formatCurrency(sale.net_value)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">
                  Comissão ({sale.commission_rate?.toFixed(2) || 0}%)
                </span>
                <span className="font-mono text-lg text-green-600 font-bold">
                  {formatCurrency(sale.commission_value)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recebimentos */}
      <ReceivablesCard
        saleDate={sale.sale_date || new Date().toISOString().split('T')[0]}
        paymentCondition={sale.payment_condition}
        totalValue={sale.gross_value || 0}
        commissionValue={sale.commission_value || 0}
        commissionRate={sale.commission_rate || 0}
      />

      {/* Itens */}
      <Card>
        <CardHeader>
          <CardTitle>Itens da Venda</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Preço Unitário</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.unit_price)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.total_price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

