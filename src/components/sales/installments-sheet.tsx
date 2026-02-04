'use client'

import { useMemo, useState } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'

type InstallmentRow = {
  number: number
  dueDate: Date
  days: number
  value: number
  commission: number
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleDate: string
  firstInstallmentDays: number
  installments: number
  interval: number
  totalValue: number
  commissionPercentage: number | null
  customDaysList?: number[] | null
  onScheduleChange?: (days: number[]) => void
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
  firstInstallmentDays,
  installments,
  interval,
  totalValue,
  commissionPercentage,
  customDaysList,
  onScheduleChange,
}: Props) {
  const [editedDays, setEditedDays] = useState<number[] | null>(null)
  const isEditable = !!onScheduleChange

  const rows = useMemo<InstallmentRow[]>(() => {
    const baseDate = new Date(saleDate + 'T12:00:00')
    const installmentValue = totalValue / installments
    const commissionValue = commissionPercentage
      ? (installmentValue * commissionPercentage) / 100
      : 0

    const daysList = editedDays || customDaysList || Array.from({ length: installments }, (_, i) => firstInstallmentDays + i * interval)

    return daysList.map((days, i) => ({
      number: i + 1,
      dueDate: addDays(baseDate, days),
      days,
      value: installmentValue,
      commission: commissionValue,
    }))
  }, [saleDate, firstInstallmentDays, installments, interval, totalValue, commissionPercentage, customDaysList, editedDays])

  const handleDateChange = (index: number, newDate: Date | undefined) => {
    if (!newDate) return
    const baseDate = new Date(saleDate + 'T12:00:00')
    const diffTime = newDate.getTime() - baseDate.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

    const currentDays = editedDays || customDaysList || rows.map(r => r.days)
    const newDays = [...currentDays]
    newDays[index] = diffDays
    setEditedDays(newDays)
  }

  const handleSave = () => {
    if (editedDays && onScheduleChange) {
      onScheduleChange(editedDays)
      setEditedDays(null)
    }
    onOpenChange(false)
  }

  const handleCancel = () => {
    setEditedDays(null)
    onOpenChange(false)
  }

  const hasChanges = editedDays !== null

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
    <Drawer open={open} onOpenChange={(o) => { if (!o) handleCancel(); else onOpenChange(o) }}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEditable ? 'Editar Cronograma' : 'Detalhamento das Parcelas'}</DrawerTitle>
          <DrawerDescription className="sr-only">
            {isEditable ? 'Edite as datas de vencimento de cada parcela' : 'Visualize o detalhamento das parcelas'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-auto max-h-[60vh] space-y-4">
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
              {rows.map((row, index) => (
                <TableRow key={row.number}>
                  <TableCell className="font-medium">{row.number}</TableCell>
                  <TableCell>
                    {isEditable ? (
                      <DatePicker
                        date={row.dueDate}
                        onDateChange={(date) => handleDateChange(index, date)}
                      />
                    ) : (
                      formatDate(row.dueDate)
                    )}
                  </TableCell>
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

          {isEditable && (
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={!hasChanges}>
                Salvar
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
