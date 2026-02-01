'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { MoreHorizontal, Pencil, Trash2, ShoppingCart, Calendar } from 'lucide-react'
import { deletePersonalClient } from '@/app/actions/personal-clients'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import type { PersonalClient } from '@/types'

type Props = {
  clients: PersonalClient[]
  onEdit: (client: PersonalClient) => void
  onDeleted: (clientId: string) => void
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

export function ClientTable({ clients, onEdit, onDeleted }: Props) {
  const isMobile = useIsMobile()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteId) return

    setDeleting(true)
    try {
      const result = await deletePersonalClient(deleteId)
      if (result.success) {
        toast.success('Cliente excluído')
        onDeleted(deleteId)
      } else {
        toast.error(result.error)
      }
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">Nenhum cliente cadastrado.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Clique em &quot;Novo Cliente&quot; para começar.
        </p>
      </div>
    )
  }

  const ActionMenu = ({ client }: { client: PersonalClient }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(client)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setDeleteId(client.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const DeleteDialog = () => (
    <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. O cliente será removido da sua carteira.
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
          {clients.map((client) => {
            const hasCommission = (client.total_commission ?? 0) > 0
            const salesCount = client.total_sales ?? 0
            const lastDate = formatDateShort(client.last_sale_date)

            return (
              <Card
                key={client.id}
                className="p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Nome */}
                    <div className="font-medium truncate">
                      {client.name}
                    </div>

                    {/* Vendas */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
                      <span>{salesCount > 0
                        ? `${salesCount} venda${salesCount !== 1 ? 's' : ''}`
                        : 'Nenhuma venda'}</span>
                    </div>

                    {/* Última venda */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{lastDate || '—'}</span>
                    </div>
                  </div>

                  {/* Coluna direita: Menu + Valores */}
                  <div className="flex flex-col items-end gap-1">
                    <div onClick={(e) => e.stopPropagation()} className="-mr-2 -mt-1">
                      <ActionMenu client={client} />
                    </div>

                    {/* Faturamento */}
                    <div className="text-xs text-muted-foreground">
                      {(client.total_gross ?? 0) > 0 ? formatCurrency(client.total_gross) : '—'}
                    </div>

                    {/* Comissão */}
                    <div className={cn(
                      "text-lg font-semibold",
                      hasCommission ? "text-[#409eff]" : "text-muted-foreground"
                    )}>
                      {formatCurrency(client.total_commission)}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
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
            <TableHead>Cliente</TableHead>
            <TableHead className="text-center">Vendas</TableHead>
            <TableHead className="text-center">Faturamento</TableHead>
            <TableHead className="text-center">Comissão</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const hasCommission = (client.total_commission ?? 0) > 0
            const salesCount = client.total_sales ?? 0
            const lastDate = formatDateShort(client.last_sale_date)

            return (
              <TableRow key={client.id}>
                <TableCell className="py-3">
                  <div className="font-medium">{client.name}</div>
                  {lastDate && (
                    <div className="text-xs text-muted-foreground mt-0.5">última venda: {lastDate}</div>
                  )}
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {salesCount > 0 ? salesCount : '—'}
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {(client.total_gross ?? 0) > 0 ? formatCurrency(client.total_gross) : '—'}
                </TableCell>
                <TableCell className="text-center py-3">
                  <div className={cn(
                    "font-medium tabular-nums",
                    hasCommission ? "text-[#409eff]" : "text-muted-foreground"
                  )}>
                    {formatCurrency(client.total_commission)}
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <ActionMenu client={client} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <DeleteDialog />
    </>
  )
}
