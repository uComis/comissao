'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useOrganization } from '@/contexts/organization-context'
import { getPipedriveIntegration, disconnectIntegration, importPipedriveSellers } from '@/app/actions/integrations'
import { forceSyncSales } from '@/app/actions/sales'
import { updateOrganization } from '@/app/actions/organizations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Check, ExternalLink, Unplug, Users, Loader2, ShoppingCart, Pencil } from 'lucide-react'
import type { IntegrationWithType } from '@/types'

export default function ConfiguracoesPage() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { organization, loading: orgLoading, refresh: refreshOrg } = useOrganization()
  const [integration, setIntegration] = useState<IntegrationWithType | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [importingSellers, setImportingSellers] = useState(false)
  const [importingSales, setImportingSales] = useState(false)
  
  // Estado para edição do nome da organização
  const [editingName, setEditingName] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [savingName, setSavingName] = useState(false)
  
  // Estado para edição da taxa de dedução
  const [editingTax, setEditingTax] = useState(false)
  const [taxRate, setTaxRate] = useState('')
  const [savingTax, setSavingTax] = useState(false)

  // Mostrar toast baseado em query params (retorno do OAuth)
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'pipedrive_connected') {
      toast.success('Pipedrive conectado com sucesso')
    } else if (error) {
      const errorMessages: Record<string, string> = {
        missing_params: 'Parâmetros inválidos',
        invalid_state: 'Estado inválido',
        unauthorized: 'Não autorizado',
        connection_failed: 'Falha na conexão',
      }
      toast.error(errorMessages[error] || 'Erro ao conectar')
    }
  }, [searchParams])

  // Carregar integração
  useEffect(() => {
    async function loadIntegration() {
      if (!organization) return

      setLoading(true)
      try {
        const data = await getPipedriveIntegration(organization.id)
        setIntegration(data)
      } finally {
        setLoading(false)
      }
    }

    if (organization) {
      loadIntegration()
    }
  }, [organization])

  async function handleDisconnect() {
    if (!integration) return

    setDisconnecting(true)
    try {
      const result = await disconnectIntegration(integration.id)
      if (result.success) {
        setIntegration(null)
        toast.success('Integração desconectada')
      } else {
        toast.error(result.error)
      }
    } finally {
      setDisconnecting(false)
    }
  }

  async function handleImportSellers() {
    if (!organization) return

    setImportingSellers(true)
    try {
      const result = await importPipedriveSellers(organization.id)
      if (result.success) {
        const { imported, updated, skipped } = result.data
        toast.success(`Importação concluída: ${imported} novos, ${updated} atualizados, ${skipped} ignorados`)
      } else {
        toast.error(result.error)
      }
    } finally {
      setImportingSellers(false)
    }
  }

  async function handleImportSales() {
    if (!organization) return

    setImportingSales(true)
    try {
      const result = await forceSyncSales(organization.id)
      if (result.success) {
        const { synced, skipped, errors } = result.data
        toast.success(`Sincronização concluída: ${synced} importadas, ${skipped} ignoradas${errors > 0 ? `, ${errors} erros` : ''}`)
      } else {
        toast.error(result.error)
      }
    } finally {
      setImportingSales(false)
    }
  }

  function handleEditName() {
    setOrgName(organization?.name || '')
    setEditingName(true)
  }

  function handleCancelName() {
    setEditingName(false)
    setOrgName('')
  }

  async function handleSaveName() {
    if (!organization) return

    const name = orgName.trim()
    if (!name) {
      toast.error('Nome é obrigatório')
      return
    }

    setSavingName(true)
    try {
      const result = await updateOrganization(organization.id, { name })
      if (result.success) {
        toast.success('Nome atualizado')
        setEditingName(false)
        refreshOrg()
      } else {
        toast.error(result.error)
      }
    } finally {
      setSavingName(false)
    }
  }

  function handleEditTax() {
    setTaxRate(organization?.tax_deduction_rate?.toString() || '0')
    setEditingTax(true)
  }

  function handleCancelTax() {
    setEditingTax(false)
    setTaxRate('')
  }

  async function handleSaveTax() {
    if (!organization) return

    const rate = parseFloat(taxRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Taxa deve ser um número entre 0 e 100')
      return
    }

    setSavingTax(true)
    try {
      const result = await updateOrganization(organization.id, {
        tax_deduction_rate: rate,
      })
      if (result.success) {
        toast.success('Taxa de dedução atualizada')
        setEditingTax(false)
        refreshOrg()
      } else {
        toast.error(result.error)
      }
    } finally {
      setSavingTax(false)
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie integrações e configurações da organização
        </p>
      </div>

      {/* Seção CRM */}
      <Card>
        <CardHeader>
          <CardTitle>CRM</CardTitle>
          <CardDescription>
            Integração com seu sistema de vendas. Deals fechados são importados automaticamente para calcular comissões. Conectar é rápido — basta autorizar o acesso e pronto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : integration ? (
            // CRM conectado
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Pipedrive</span>
                    <Badge variant="secondary" className="text-xs">Conectado</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {integration.provider_account_id}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                <Unplug className="mr-2 h-4 w-4" />
                {disconnecting ? 'Desconectando...' : 'Desconectar'}
              </Button>
            </div>
          ) : (
            // Nenhum CRM conectado - mostrar opções
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <span className="text-lg font-bold">P</span>
                  </div>
                  <div>
                    <span className="font-medium">Pipedrive</span>
                    <p className="text-sm text-muted-foreground">
                      Sincronize deals do Pipedrive
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <a href="/api/pipedrive/auth">
                    Conectar
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <span className="text-lg font-bold">H</span>
                  </div>
                  <div>
                    <span className="font-medium">HubSpot</span>
                    <p className="text-sm text-muted-foreground">
                      Sincronize deals do HubSpot
                    </p>
                  </div>
                </div>
                <Badge variant="outline">Em breve</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção Sincronização - só aparece se CRM conectado */}
      {integration && (
        <Card>
          <CardHeader>
            <CardTitle>Sincronização</CardTitle>
            <CardDescription>
              O sistema sincroniza automaticamente a cada acesso. Quer forçar agora? Clique no botão — pode usar quando quiser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-medium">Importar Vendedores</span>
                  <p className="text-sm text-muted-foreground">
                    Importa usuários do Pipedrive como vendedores
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleImportSellers}
                disabled={importingSellers}
              >
                {importingSellers ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  'Importar'
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-medium">Importar Vendas</span>
                  <p className="text-sm text-muted-foreground">
                    Importa deals ganhos do Pipedrive como vendas
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleImportSales}
                disabled={importingSales}
              >
                {importingSales ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  'Importar'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção Organização */}
      <Card>
        <CardHeader>
          <CardTitle>Organização</CardTitle>
          <CardDescription>
            Dados da empresa. Aqui você configura nome e regras fiscais (taxa de dedução) que afetam o cálculo das comissões. São poucos campos — leva menos de 1 minuto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nome</label>
            {editingName ? (
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-64"
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveName} disabled={savingName}>
                  {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelName} disabled={savingName}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground">
                  {organization.name}
                </p>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleEditName}>
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Taxa de dedução (impostos)</label>
            {editingTax ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="relative w-24">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="pr-6"
                    autoFocus
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
                <Button size="sm" onClick={handleSaveTax} disabled={savingTax}>
                  {savingTax ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelTax} disabled={savingTax}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground">
                  {organization.tax_deduction_rate != null 
                    ? `${organization.tax_deduction_rate}%` 
                    : 'Não configurada'}
                </p>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleEditTax}>
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Percentual deduzido do valor bruto para calcular o valor líquido (base da comissão)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Seção Conta */}
      <Card>
        <CardHeader>
          <CardTitle>Conta</CardTitle>
          <CardDescription>
            Seus dados pessoais de acesso. Vinculado ao login Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nome</label>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.user_metadata?.name || user?.user_metadata?.full_name || '-'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.email}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

