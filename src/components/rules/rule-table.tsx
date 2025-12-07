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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, RotateCcw, Users, Star } from 'lucide-react'
import { deleteCommissionRule, reactivateCommissionRule } from '@/app/actions/commission-rules'
import { toast } from 'sonner'
import type { CommissionRuleWithSellers } from '@/types'
import { RuleDialog } from './rule-dialog'
import { AssignSellersDialog } from './assign-sellers-dialog'

type Props = {
  rules: CommissionRuleWithSellers[]
  organizationId: string
  sellers: Array<{ id: string; name: string }>
  showInactive?: boolean
  onRefresh?: () => void
}

function formatPercentage(value: number | null): string {
  if (value === null) return '-'
  return `${value}%`
}

function formatTiers(tiers: Array<{ min: number; max: number | null; percentage: number }> | null): string {
  if (!tiers || tiers.length === 0) return '-'
  return tiers
    .map((t) => {
      const max = t.max === null ? '+' : `R$ ${t.max.toLocaleString('pt-BR')}`
      return `R$ ${t.min.toLocaleString('pt-BR')} - ${max}: ${t.percentage}%`
    })
    .join(' | ')
}

export function RuleTable({ rules, organizationId, sellers, showInactive = false, onRefresh }: Props) {
  const [editingRule, setEditingRule] = useState<CommissionRuleWithSellers | null>(null)
  const [assigningRule, setAssigningRule] = useState<CommissionRuleWithSellers | null>(null)

  const filteredRules = showInactive ? rules : rules.filter((r) => r.is_active)

  async function handleDelete(id: string) {
    const result = await deleteCommissionRule(id)
    if (result.success) {
      toast.success('Regra desativada')
      onRefresh?.()
    } else {
      toast.error(result.error)
    }
  }

  async function handleReactivate(id: string) {
    const result = await reactivateCommissionRule(id, organizationId)
    if (result.success) {
      toast.success('Regra reativada')
      onRefresh?.()
    } else {
      toast.error(result.error)
    }
  }

  if (filteredRules.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Nenhuma regra de comissão cadastrada
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Vendedores</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {rule.name}
                  {rule.is_default && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3 w-3" />
                      Padrão
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {rule.type === 'fixed' ? 'Fixa' : 'Escalonada'}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[300px] truncate">
                {rule.type === 'fixed'
                  ? formatPercentage(rule.percentage)
                  : formatTiers(rule.tiers)}
              </TableCell>
              <TableCell>
                {rule.sellers.length > 0 ? (
                  <Badge variant="secondary">
                    {rule.sellers.length} vendedor{rule.sellers.length !== 1 ? 'es' : ''}
                  </Badge>
                ) : rule.is_default ? (
                  <span className="text-muted-foreground text-sm">Todos sem regra específica</span>
                ) : (
                  <span className="text-muted-foreground text-sm">Nenhum</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={rule.is_active ? 'default' : 'outline'}>
                  {rule.is_active ? 'Ativa' : 'Inativa'}
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
                    <DropdownMenuItem onClick={() => setEditingRule(rule)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAssigningRule(rule)}>
                      <Users className="mr-2 h-4 w-4" />
                      Vincular Vendedores
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {rule.is_active ? (
                      <DropdownMenuItem
                        onClick={() => handleDelete(rule.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Desativar
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleReactivate(rule.id)}>
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

      <RuleDialog
        open={!!editingRule}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRule(null)
            onRefresh?.()
          }
        }}
        organizationId={organizationId}
        rule={editingRule}
      />

      <AssignSellersDialog
        open={!!assigningRule}
        onOpenChange={(open) => {
          if (!open) {
            setAssigningRule(null)
            onRefresh?.()
          }
        }}
        organizationId={organizationId}
        rule={assigningRule}
        sellers={sellers}
      />
    </>
  )
}

