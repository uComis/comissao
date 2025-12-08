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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Lock } from 'lucide-react'
import type { SaleWithCommission } from '@/types'

type Props = {
  sales: SaleWithCommission[]
  selectionMode?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
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

export function SalesTable({
  sales,
  selectionMode = false,
  selectedIds = new Set(),
  onSelectionChange,
}: Props) {
  // Vendas fechadas (elegíveis para seleção)
  const closedSales = sales.filter((s) => s.commission?.is_closed)

  function handleToggle(saleId: string) {
    if (!onSelectionChange) return
    const newSet = new Set(selectedIds)
    if (newSet.has(saleId)) {
      newSet.delete(saleId)
    } else {
      newSet.add(saleId)
    }
    onSelectionChange(newSet)
  }

  function handleToggleAll() {
    if (!onSelectionChange) return
    if (selectedIds.size === closedSales.length) {
      // Desmarcar todos
      onSelectionChange(new Set())
    } else {
      // Marcar todos
      onSelectionChange(new Set(closedSales.map((s) => s.id)))
    }
  }

  if (sales.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Nenhuma venda encontrada
      </div>
    )
  }

  const allSelected = closedSales.length > 0 && selectedIds.size === closedSales.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < closedSales.length

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            {selectionMode && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={handleToggleAll}
                  aria-label="Selecionar todas"
                />
              </TableHead>
            )}
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead className="text-right">Valor Bruto</TableHead>
            <TableHead className="text-right">Valor Líquido</TableHead>
            <TableHead className="text-right">Comissão</TableHead>
            <TableHead>Origem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => {
            const isClosed = sale.commission?.is_closed
            const isSelected = selectedIds.has(sale.id)

            return (
              <TableRow
                key={sale.id}
                className={isSelected ? 'bg-muted/50' : undefined}
              >
                {selectionMode && (
                  <TableCell>
                    {isClosed ? (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(sale.id)}
                        aria-label={`Selecionar ${sale.client_name}`}
                      />
                    ) : (
                      <span className="w-4" />
                    )}
                  </TableCell>
                )}
                <TableCell>{formatDate(sale.sale_date)}</TableCell>
                <TableCell className="font-medium">{sale.client_name}</TableCell>
                <TableCell>{sale.seller?.name || '-'}</TableCell>
                <TableCell className="text-right">{formatCurrency(sale.gross_value)}</TableCell>
                <TableCell className="text-right">{formatCurrency(sale.net_value)}</TableCell>
                <TableCell className="text-right">
                  {sale.commission ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={`inline-flex items-center gap-1 font-medium ${
                          sale.commission.is_closed
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {formatCurrency(sale.commission.amount)}
                          {sale.commission.is_closed && <Lock className="h-3 w-3" />}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p>{sale.commission.rule_name || 'Regra não definida'}</p>
                          <p>{sale.commission.percentage_applied.toFixed(2)}%</p>
                          <p className="text-muted-foreground">
                            {sale.commission.is_closed ? 'Fechada' : 'Calculada (aberta)'}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {sale.external_id ? (
                    <Badge variant="outline">Pipedrive</Badge>
                  ) : (
                    <Badge variant="secondary">Manual</Badge>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TooltipProvider>
  )
}

