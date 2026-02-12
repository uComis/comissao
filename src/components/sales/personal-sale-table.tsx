'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MoreHorizontal, Eye, Trash2, Calendar, Building2, Receipt } from 'lucide-react'
import { deletePersonalSale } from '@/app/actions/personal-sales'
import { toast } from 'sonner'
import type { PersonalSale } from '@/types'

type Props = {
  sales: PersonalSale[]
  onSaleDeleted?: (id: string) => void
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

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDate()
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

function getCommissionPercent(rate: number | null): string | null {
  if (rate === null || rate === undefined || rate === 0) return null
  return rate % 1 === 0 ? rate.toFixed(0) + '%' : rate.toFixed(1) + '%'
}

function CommissionBadge({ percent }: { percent: string | null }) {
  if (!percent) return null
  return (
    <span className="inline-flex items-center rounded-full bg-[#67C23A]/10 px-1.5 py-0.5 text-xs font-medium text-[#67C23A]">
      {percent}
    </span>
  )
}

export function PersonalSaleTable({ sales, onSaleDeleted }: Props) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ sale: PersonalSale; x: number; y: number } | null>(null)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)

    try {
      const result = await deletePersonalSale(deleteId)
      if (result.success) {
        toast.success('Venda excluída')
        onSaleDeleted?.(deleteId)
      } else {
        toast.error(result.error)
      }
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  function handleView(id: string) {
    router.push(`/minhasvendas/${id}`)
  }

  function handleViewReceivables(sale: PersonalSale) {
    router.push(`/faturamento?saleId=${sale.sale_number}`)
  }

  if (sales.length === 0) {
    return null
  }

  const handleContextMenu = (e: React.MouseEvent, sale: PersonalSale) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ sale, x: e.clientX, y: e.clientY })
  }

  const closeContextMenu = () => setContextMenu(null)

  const ActionMenu = ({ sale }: { sale: PersonalSale }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => { handleView(sale.id); closeContextMenu() }}>
          <Eye className="h-4 w-4 mr-2" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { handleViewReceivables(sale); closeContextMenu() }}>
          <Receipt className="h-4 w-4 mr-2" />
          Ver Recebíveis
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => { setDeleteId(sale.id); closeContextMenu() }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const DeleteDialog = () => (
    <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir venda?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  // Mobile: Cards view
  // Desktop: Compact table
  // Both rendered, visibility controlled by CSS to avoid layout flash
  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {sales.map((sale) => {
          const percent = getCommissionPercent(sale.commission_rate)

          return (
            <Card
              key={sale.id}
              className="p-4 active:scale-[0.98] transition-transform"
              onClick={() => handleView(sale.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="font-medium truncate">
                    {sale.client_name || 'Cliente não informado'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{sale.supplier?.name || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(sale.sale_date)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div onClick={(e) => e.stopPropagation()} className="-mr-2 -mt-1">
                    <ActionMenu sale={sale} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(sale.gross_value)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "text-lg font-semibold",
                      sale.commission_value && sale.commission_value > 0 ? "text-[#409eff]" : "text-muted-foreground"
                    )}>
                      {formatCurrency(sale.commission_value)}
                    </span>
                    <CommissionBadge percent={percent} />
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-center">Valor</TableHead>
                <TableHead className="text-center">Comissão</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => {
                const percent = getCommissionPercent(sale.commission_rate)
                const hasCommission = sale.commission_value != null && sale.commission_value > 0

                return (
                  <TableRow
                    key={sale.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleView(sale.id)}
                    onContextMenu={(e) => handleContextMenu(e, sale)}
                  >
                    <TableCell className="py-3 tabular-nums text-muted-foreground text-sm">
                      {formatShortDate(sale.sale_date)}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="font-medium">{sale.client_name || 'Cliente não informado'}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{sale.supplier?.name || '-'}</div>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {formatCurrency(sale.gross_value)}
                    </TableCell>
                    <TableCell className="text-center py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={cn("font-medium tabular-nums", hasCommission ? "text-[#409eff]" : "text-muted-foreground")}>
                          {formatCurrency(sale.commission_value)}
                        </span>
                        <CommissionBadge percent={percent} />
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <ActionMenu sale={sale} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
        </Table>
      </div>

      <DeleteDialog />

      {/* Context Menu (Right Click) */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
            onContextMenu={(e) => { e.preventDefault(); closeContextMenu() }}
          />
          <DropdownMenu open={!!contextMenu} onOpenChange={(open) => !open && closeContextMenu()}>
            <DropdownMenuContent
              align="start"
              className="fixed z-50 min-w-[180px]"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
                transform: 'none'
              }}
            >
              <DropdownMenuItem onClick={() => { handleView(contextMenu.sale.id); closeContextMenu() }}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { handleViewReceivables(contextMenu.sale); closeContextMenu() }}>
                <Receipt className="h-4 w-4 mr-2" />
                Ver Recebíveis
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setDeleteId(contextMenu.sale.id); closeContextMenu() }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </>
  )
}
