'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOrganization } from '@/contexts/app-data-context'
import { getSellersWithRules } from '@/app/actions/sellers'
import { importPipedriveSellers, getPipedriveIntegration } from '@/app/actions/integrations'
import { SellerTable, SellerDialog } from '@/components/sellers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Plus, Users, Download, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import type { SellerWithRule, IntegrationWithType } from '@/types'

export default function VendedoresPage() {
  const { organization, loading: orgLoading } = useOrganization()
  const [sellers, setSellers] = useState<SellerWithRule[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [integration, setIntegration] = useState<IntegrationWithType | null>(null)
  const [importing, setImporting] = useState(false)

  const loadSellers = useCallback(async () => {
    if (!organization) return
    setLoading(true)
    try {
      const data = await getSellersWithRules(organization.id)
      setSellers(data)
    } finally {
      setLoading(false)
    }
  }, [organization])

  useEffect(() => {
    loadSellers()
  }, [loadSellers])

  useEffect(() => {
    async function loadIntegration() {
      if (!organization) return
      const data = await getPipedriveIntegration(organization.id)
      setIntegration(data)
    }
    loadIntegration()
  }, [organization])

  async function handleImportSellers() {
    if (!organization) return
    setImporting(true)
    try {
      const result = await importPipedriveSellers(organization.id)
      if (result.success) {
        const { imported, updated, skipped } = result.data
        toast.success(`Importação concluída: ${imported} novos, ${updated} atualizados, ${skipped} ignorados`)
        loadSellers()
      } else {
        toast.error(result.error)
      }
    } finally {
      setImporting(false)
    }
  }

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      loadSellers()
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

  const activeCount = sellers.filter((s) => s.is_active).length
  const inactiveCount = sellers.filter((s) => !s.is_active).length

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Vendedores" 
        description="Gerencie os vendedores da sua organização"
      >
        {integration && (
          <Button variant="outline" onClick={handleImportSellers} disabled={importing}>
            {importing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {importing ? 'Importando...' : 'Importar'}
          </Button>
        )}
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Vendedor
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sellers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
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
              <CardTitle>Lista de Vendedores</CardTitle>
              <CardDescription>
                {showInactive
                  ? 'Mostrando todos os vendedores'
                  : 'Mostrando apenas vendedores ativos'}
              </CardDescription>
            </div>
            {inactiveCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInactive(!showInactive)}
              >
                {showInactive ? 'Ocultar inativos' : 'Mostrar inativos'}
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
            <SellerTable
              sellers={sellers}
              organizationId={organization.id}
              showInactive={showInactive}
              onRefresh={loadSellers}
            />
          )}
        </CardContent>
      </Card>

      <SellerDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        organizationId={organization.id}
      />
    </div>
  )
}

