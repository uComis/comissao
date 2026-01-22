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
import { MoreHorizontal, Eye, Trash2, Calendar, Building2, User, Receipt } from 'lucide-react'
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
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr + 'T00:00:00'))
}

export function PersonalSaleTable({ sales }: Props) {
  const router = useRouter()
  const isMobile = useIsMobile()
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
    // Use sale_number for user-friendly filtering
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
                  {/* Sale Number + Cliente */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">#{sale.sale_number}</span>
                    <div className="font-medium truncate">
                      {sale.client_name || 'Cliente não informado'}
                    </div>
                  </div>

                  {/* Fornecedor */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{sale.supplier?.name || '-'}</span>
                  </div>

                  {/* Data */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(sale.sale_date)}</span>
                  </div>
                </div>

                {/* Coluna direita: Menu + Valores */}
                <div className="flex flex-col items-end gap-1">
                  {/* Menu de ações */}
                  <div onClick={(e) => e.stopPropagation()} className="-mr-2 -mt-1">
                    <ActionMenu sale={sale} />
                  </div>

                  {/* Valor bruto */}
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(sale.gross_value)}
                  </div>

                  {/* Comissão - destaque */}
                  <div className="text-lg text-green-500 font-semibold">
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
              <TableHead className="w-[80px]">#</TableHead>
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
              <TableRow 
                key={sale.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleView(sale.id)}
                onContextMenu={(e) => handleContextMenu(e, sale)}
              >
                <TableCell className="text-sm text-muted-foreground">
                  #{sale.sale_number}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(sale.sale_date)}
                </TableCell>
                <TableCell className="font-medium">
                  {sale.client_name || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sale.supplier?.name || '-'}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(sale.gross_value)}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {formatCurrency(sale.commission_value)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <ActionMenu sale={sale} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </Table>
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

