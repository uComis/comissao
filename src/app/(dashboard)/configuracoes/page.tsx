'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useOrganization } from '@/contexts/organization-context'
import { getPipedriveIntegration, disconnectIntegration, importPipedriveSellers } from '@/app/actions/integrations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Check, ExternalLink, Unplug, Users, Loader2 } from 'lucide-react'
import type { IntegrationWithType } from '@/types'

export default function ConfiguracoesPage() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { organization, loading: orgLoading } = useOrganization()
  const [integration, setIntegration] = useState<IntegrationWithType | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [importingSellers, setImportingSellers] = useState(false)

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
            Conecte seu CRM para sincronizar vendas automaticamente
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
              Importe dados do CRM para o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Seção Organização */}
      <Card>
        <CardHeader>
          <CardTitle>Organização</CardTitle>
          <CardDescription>
            Informações da sua organização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nome</label>
            <p className="text-sm text-muted-foreground mt-1">
              {organization.name}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Taxa de dedução (impostos)</label>
            <p className="text-sm text-muted-foreground mt-1">
              Configuração disponível em breve
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Seção Conta */}
      <Card>
        <CardHeader>
          <CardTitle>Conta</CardTitle>
          <CardDescription>
            Informações da sua conta
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

