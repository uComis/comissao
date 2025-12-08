'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { SaleWithSeller } from '@/types'

type Props = {
  sales: SaleWithSeller[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function SalesTable({ sales }: Props) {
  if (sales.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Nenhuma venda encontrada
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Vendedor</TableHead>
          <TableHead className="text-right">Valor Bruto</TableHead>
          <TableHead className="text-right">Valor Líquido</TableHead>
          <TableHead>Origem</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => (
          <TableRow key={sale.id}>
            <TableCell>{formatDate(sale.sale_date)}</TableCell>
            <TableCell className="font-medium">{sale.client_name}</TableCell>
            <TableCell>{sale.seller?.name || '-'}</TableCell>
            <TableCell className="text-right">{formatCurrency(sale.gross_value)}</TableCell>
            <TableCell className="text-right">{formatCurrency(sale.net_value)}</TableCell>
            <TableCell>
              {sale.external_id ? (
                <Badge variant="outline">Pipedrive</Badge>
              ) : (
                <Badge variant="secondary">Manual</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

