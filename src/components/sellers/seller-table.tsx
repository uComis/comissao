'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, RotateCcw } from 'lucide-react'
import { deleteSeller, reactivateSeller } from '@/app/actions/sellers'
import { toast } from 'sonner'
import type { SellerWithRule } from '@/types'
import { SellerDialog } from './seller-dialog'

type Props = {
  sellers: SellerWithRule[]
  organizationId: string
  showInactive?: boolean
  onRefresh?: () => void
}

export function SellerTable({ sellers, organizationId, showInactive = false, onRefresh }: Props) {
  const [editingSeller, setEditingSeller] = useState<SellerWithRule | null>(null)

  const filteredSellers = showInactive
    ? sellers
    : sellers.filter((s) => s.is_active)

  async function handleDelete(id: string) {
    const result = await deleteSeller(id)
    if (result.success) {
      toast.success('Vendedor desativado')
      onRefresh?.()
    } else {
      toast.error(result.error)
    }
  }

  async function handleReactivate(id: string) {
    const result = await reactivateSeller(id)
    if (result.success) {
      toast.success('Vendedor reativado')
      onRefresh?.()
    } else {
      toast.error(result.error)
    }
  }

  if (filteredSellers.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Nenhum vendedor cadastrado
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Comissão</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSellers.map((seller) => (
            <TableRow key={seller.id}>
              <TableCell className="font-medium">{seller.name}</TableCell>
              <TableCell>{seller.email || '-'}</TableCell>
              <TableCell>
                {seller.commission_rule ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{seller.commission_rule.name}</span>
                    {seller.commission_rule.is_default && (
                      <span className="text-xs text-muted-foreground">(padrão)</span>
                    )}
                    {seller.commission_rule.type === 'fixed' && seller.commission_rule.percentage && (
                      <Badge variant="outline" className="ml-1">
                        {seller.commission_rule.percentage}%
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Sem regra</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={seller.is_active ? 'default' : 'outline'}>
                  {seller.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingSeller(seller)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    {seller.is_active ? (
                      <DropdownMenuItem
                        onClick={() => handleDelete(seller.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Desativar
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleReactivate(seller.id)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reativar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SellerDialog
        open={!!editingSeller}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSeller(null)
            onRefresh?.()
          }
        }}
        organizationId={organizationId}
        seller={editingSeller}
      />
    </>
  )
}

