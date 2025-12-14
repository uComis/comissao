'use client'

import { useMemo } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'

type InstallmentRow = {
  number: number
  dueDate: Date
  value: number
  commission: number
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleDate: string
  installments: number
  interval: number
  totalValue: number
  commissionPercentage: number | null
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function InstallmentsSheet({
  open,
  onOpenChange,
  saleDate,
  installments,
  interval,
  totalValue,
  commissionPercentage,
}: Props) {
  const rows = useMemo<InstallmentRow[]>(() => {
    const baseDate = new Date(saleDate + 'T12:00:00')
    const installmentValue = totalValue / installments
    const commissionValue = commissionPercentage
      ? (installmentValue * commissionPercentage) / 100
      : 0

    return Array.from({ length: installments }, (_, i) => ({
      number: i + 1,
      dueDate: addDays(baseDate, (i + 1) * interval),
      value: installmentValue,
      commission: commissionValue,
    }))
  }, [saleDate, installments, interval, totalValue, commissionPercentage])

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        value: acc.value + row.value,
        commission: acc.commission + row.commission,
      }),
      { value: 0, commission: 0 }
    )
  }, [rows])

  const hasCommission = commissionPercentage !== null && commissionPercentage > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-6">
        <SheetHeader className="mb-6">
          <SheetTitle>Detalhamento das Parcelas</SheetTitle>
        </SheetHeader>

        <div className="overflow-auto max-h-[calc(100vh-160px)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                {hasCommission && (
                  <TableHead className="text-right">
                    Comissão ({commissionPercentage}%)
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.number}>
                  <TableCell className="font-medium">{row.number}</TableCell>
                  <TableCell>{formatDate(row.dueDate)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.value)}
                  </TableCell>
                  {hasCommission && (
                    <TableCell className="text-right">
                      {formatCurrency(row.commission)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-semibold">
                  Total
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(totals.value)}
                </TableCell>
                {hasCommission && (
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(totals.commission)}
                  </TableCell>
                )}
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  )
}

