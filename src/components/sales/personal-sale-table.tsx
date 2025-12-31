'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { MoreHorizontal, Eye, Trash2, Calendar, Building2, User } from 'lucide-react'
import { deletePersonalSale } from '@/app/actions/personal-sales'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import type { PersonalSale } from '@/types'

type Props = {
  sales: PersonalSale[]
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
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr))
}

export function PersonalSaleTable({ sales }: Props) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)

    try {
      const result = await deletePersonalSale(deleteId)
      if (result.success) {
        toast.success('Venda excluída')
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

  if (sales.length === 0) {
    return null
  }

  const ActionMenu = ({ saleId }: { saleId: string }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleView(saleId)}>
          <Eye className="h-4 w-4 mr-2" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setDeleteId(saleId)}
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
  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {sales.map((sale) => (
            <Card
              key={sale.id}
              className="p-4 active:scale-[0.98] transition-transform"
              onClick={() => handleView(sale.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Cliente */}
                  <div className="font-medium truncate">
                    {sale.client_name || 'Cliente não informado'}
                  </div>

                  {/* Fornecedor */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{sale.supplier?.name || '-'}</span>
                  </div>

                  {/* Data */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Calendar className="h-3 w-3" />
                    <span className="font-mono">{formatDate(sale.sale_date)}</span>
                  </div>
                </div>

                {/* Coluna direita: Menu + Valores */}
                <div className="flex flex-col items-end gap-1">
                  {/* Menu de ações */}
                  <div onClick={(e) => e.stopPropagation()} className="-mr-2 -mt-1">
                    <ActionMenu saleId={sale.id} />
                  </div>

                  {/* Valor bruto */}
                  <div className="text-xs font-mono text-muted-foreground">
                    {formatCurrency(sale.gross_value)}
                  </div>

                  {/* Comissão - destaque */}
                  <div className="text-lg font-mono text-green-500 font-semibold">
                    {formatCurrency(sale.commission_value)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <DeleteDialog />
      </>
    )
  }

  // Desktop: Table view
  return (
    <>
      <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Comissão</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-mono text-sm">
                  {formatDate(sale.sale_date)}
                </TableCell>
                <TableCell className="font-medium">
                  {sale.client_name || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sale.supplier?.name || '-'}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(sale.gross_value)}
                </TableCell>
                <TableCell className="text-right font-mono text-green-600">
                  {formatCurrency(sale.commission_value)}
                </TableCell>
                <TableCell>
                  <ActionMenu saleId={sale.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </Table>
      <DeleteDialog />
    </>
  )
}

