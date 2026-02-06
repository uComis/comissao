'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Pencil, Trash2, ShoppingCart, Calendar, Lock } from 'lucide-react'
import { deletePersonalSupplier, type PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import { getBlockedSuppliers } from '@/app/actions/billing'
import { toast } from 'sonner'

type Props = {
  suppliers: PersonalSupplierWithRules[]
  onDelete?: (id: string) => void
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null || value === 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDate()
  const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

export function SupplierTable({ suppliers, onDelete }: Props) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [blockedSupplierIds, setBlockedSupplierIds] = useState<string[]>([])

  useEffect(() => {
    async function loadBlockedSuppliers() {
      try {
        const result = await getBlockedSuppliers('')
        setBlockedSupplierIds(result.blockedSupplierIds)
      } catch (error) {
        console.error('Error loading blocked suppliers:', error)
      }
    }

    if (suppliers.length > 0) {
      loadBlockedSuppliers()
    }
  }, [suppliers])

  const isBlocked = (supplierId: string) => blockedSupplierIds.includes(supplierId)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)

    try {
      const result = await deletePersonalSupplier(deleteId)
      if (result.success) {
        toast.success('Fornecedor excluído')
        onDelete?.(deleteId)
      } else {
        toast.error(result.error)
      }
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  function handleEdit(id: string) {
    router.push(`/fornecedores/${id}`)
  }

  if (suppliers.length === 0) {
    return null
  }

  const ActionMenu = ({ supplier }: { supplier: PersonalSupplierWithRules }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleEdit(supplier.id)}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setDeleteId(supplier.id)}
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
          <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Todas as vendas e recebíveis associados a este fornecedor também serão excluídos.
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

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {suppliers.map((supplier) => {
          const blocked = isBlocked(supplier.id)
          const hasCommission = (supplier.total_commission ?? 0) > 0
          const salesCount = supplier.total_sales ?? 0
          const lastDate = formatDateShort(supplier.last_sale_date)

          return (
            <Card
              key={supplier.id}
              className={`p-4 ${blocked ? 'opacity-60' : 'cursor-pointer active:scale-[0.98] transition-transform'}`}
              onClick={() => !blocked && handleEdit(supplier.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{supplier.name}</span>
                    {blocked && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Bloqueado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
                    <span>{salesCount > 0
                      ? `${salesCount} venda${salesCount !== 1 ? 's' : ''}`
                      : 'Nenhuma venda'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{lastDate || '—'}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {!blocked && (
                    <div onClick={(e) => e.stopPropagation()} className="-mr-2 -mt-1">
                      <ActionMenu supplier={supplier} />
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {(supplier.total_gross ?? 0) > 0 ? formatCurrency(supplier.total_gross) : '—'}
                  </div>
                  <div className={cn(
                    "text-lg font-semibold",
                    hasCommission ? "text-[#409eff]" : "text-muted-foreground"
                  )}>
                    {formatCurrency(supplier.total_commission)}
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
              <TableHead>Pasta</TableHead>
              <TableHead className="text-center">Vendas</TableHead>
              <TableHead className="text-center">Faturamento</TableHead>
              <TableHead className="text-center">Comissão</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => {
              const blocked = isBlocked(supplier.id)
              const hasCommission = (supplier.total_commission ?? 0) > 0
              const salesCount = supplier.total_sales ?? 0
              const lastDate = formatDateShort(supplier.last_sale_date)

              return (
                <TableRow key={supplier.id} className={blocked ? 'opacity-60' : 'cursor-pointer'} onClick={() => !blocked && handleEdit(supplier.id)}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{supplier.name}</span>
                      {blocked && (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Bloqueado
                        </Badge>
                      )}
                    </div>
                    {lastDate && (
                      <div className="text-xs text-muted-foreground mt-0.5">última venda: {lastDate}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-muted-foreground">
                    {salesCount > 0 ? salesCount : '—'}
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-muted-foreground">
                    {(supplier.total_gross ?? 0) > 0 ? formatCurrency(supplier.total_gross) : '—'}
                  </TableCell>
                  <TableCell className="text-center py-3">
                    <div className={cn(
                      "font-medium tabular-nums",
                      hasCommission ? "text-[#409eff]" : "text-muted-foreground"
                    )}>
                      {formatCurrency(supplier.total_commission)}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {!blocked && <ActionMenu supplier={supplier} />}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <DeleteDialog />
    </>
  )
}
