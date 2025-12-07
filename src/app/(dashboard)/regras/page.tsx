'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOrganization } from '@/contexts/organization-context'
import { getCommissionRulesWithSellers } from '@/app/actions/commission-rules'
import { getActiveSellers } from '@/app/actions/sellers'
import { RuleTable, RuleDialog } from '@/components/rules'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Scale, Star, Layers } from 'lucide-react'
import type { CommissionRuleWithSellers, Seller } from '@/types'

export default function RegrasPage() {
  const { organization, loading: orgLoading } = useOrganization()
  const [rules, setRules] = useState<CommissionRuleWithSellers[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showInactive, setShowInactive] = useState(false)

  const loadData = useCallback(async () => {
    if (!organization) return
    setLoading(true)
    try {
      const [rulesData, sellersData] = await Promise.all([
        getCommissionRulesWithSellers(organization.id),
        getActiveSellers(organization.id),
      ])
      setRules(rulesData)
      setSellers(sellersData)
    } finally {
      setLoading(false)
    }
  }, [organization])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      loadData()
    }
  }

  if (orgLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Organização não encontrada
      </div>
    )
  }

  const activeCount = rules.filter((r) => r.is_active).length
  const inactiveCount = rules.filter((r) => !r.is_active).length
  const defaultRule = rules.find((r) => r.is_default && r.is_active)
  const tieredCount = rules.filter((r) => r.is_active && r.type === 'tiered').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Regras de Comissão</h1>
          <p className="text-muted-foreground">
            Configure as regras de cálculo de comissões
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Regra
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ativas</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regra Padrão</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {defaultRule ? defaultRule.name : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalonadas</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tieredCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{inactiveCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Regras</CardTitle>
              <CardDescription>
                {showInactive
                  ? 'Mostrando todas as regras'
                  : 'Mostrando apenas regras ativas'}
              </CardDescription>
            </div>
            {inactiveCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInactive(!showInactive)}
              >
                {showInactive ? 'Ocultar inativas' : 'Mostrar inativas'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <RuleTable
              rules={rules}
              organizationId={organization.id}
              sellers={sellers.map((s) => ({ id: s.id, name: s.name }))}
              showInactive={showInactive}
              onRefresh={loadData}
            />
          )}
        </CardContent>
      </Card>

      <RuleDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        organizationId={organization.id}
      />
    </div>
  )
}

