'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Pencil, Trash2, FileText, Percent, Lock } from 'lucide-react'
import { deletePersonalSupplier, type PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import { getBlockedSuppliers } from '@/app/actions/billing'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import type { CommissionRule } from '@/types'

type Props = {
  suppliers: PersonalSupplierWithRules[]
}

function formatCnpj(cnpj: string): string {
  if (!cnpj || cnpj.length !== 14) return cnpj || '-'
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`
}

function getRuleDescription(rule: CommissionRule | null): string {
  if (!rule) return 'Não configurada'
  
  switch (rule.type) {
    case 'fixed':
      return rule.percentage ? `${rule.percentage}%` : 'Não configurada'
    case 'tiered':
      return rule.tiers && rule.tiers.length > 0 
        ? `Escalonada (${rule.tiers.length} faixas)` 
        : 'Não configurada'
    default:
      return 'Não configurada'
  }
}


export function SupplierTable({ suppliers }: Props) {
  const router = useRouter()
  const isMobile = useIsMobile()
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
        <Button variant="ghost" size="icon" className="h-8 w-8">
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

  // Mobile: Cards view
  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {suppliers.map((supplier) => {
            const blocked = isBlocked(supplier.id)
            
            return (
              <Card
                key={supplier.id}
                className={`p-4 transition-transform ${blocked ? 'opacity-60' : 'active:scale-[0.98]'}`}
                onClick={() => !blocked && handleEdit(supplier.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Nome */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{supplier.name}</span>
                      {blocked && (
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Bloqueado
                        </Badge>
                      )}
                    </div>

                    {/* CNPJ */}
                    {supplier.cnpj && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-xs">{formatCnpj(supplier.cnpj)}</span>
                      </div>
                    )}

                    {/* Comissão */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Percent className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs">{getRuleDescription(supplier.default_rule || null)}</span>
                    </div>
                  </div>

                  {/* Menu de ações */}
                  {!blocked && (
                    <div className="-mr-2 -mt-1" onClick={(e) => e.stopPropagation()}>
                      <ActionMenu supplier={supplier} />
                    </div>
                  )}
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
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Comissão</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => {
              const blocked = isBlocked(supplier.id)
              
              return (
                <TableRow key={supplier.id} className={blocked ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {supplier.name}
                      {blocked && (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Bloqueado
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatCnpj(supplier.cnpj || '')}
                  </TableCell>
                  <TableCell>{getRuleDescription(supplier.default_rule || null)}</TableCell>
                  <TableCell>
                    {!blocked && <ActionMenu supplier={supplier} />}
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
