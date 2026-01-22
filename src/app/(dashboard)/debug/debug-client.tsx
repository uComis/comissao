'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Bug, User, CreditCard, Settings, BarChart3, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react'

type DebugClientProps = {
  user: any
  subscription: any
  profile: any
  preferences: any
  usageStats: any
}

export function DebugClient({ user, subscription, profile, preferences, usageStats }: DebugClientProps) {
  // Calcular informações derivadas
  const trialActive = subscription?.trial_start_date && subscription?.trial_period_days
    ? new Date(subscription.trial_start_date).getTime() + (subscription.trial_period_days * 24 * 60 * 60 * 1000) > Date.now()
    : false

  const trialDaysRemaining = subscription?.trial_start_date && subscription?.trial_period_days
    ? Math.max(0, Math.ceil((new Date(subscription.trial_start_date).getTime() + (subscription.trial_period_days * 24 * 60 * 60 * 1000) - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0

  const isPaidUp = subscription?.asaas_subscription_id && subscription?.current_period_end
    ? new Date(subscription.current_period_end) > new Date()
    : false

  const effectivePlan = trialActive ? 'ultra' : (isPaidUp ? subscription?.plan_group : 'free')

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <Bug className="h-8 w-8 text-yellow-500" />
        <div>
          <h1 className="text-3xl font-bold">Debug Info</h1>
          <p className="text-muted-foreground">Informações técnicas do sistema</p>
        </div>
      </div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Plano Efetivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold uppercase">{effectivePlan}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Trial Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {trialActive ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">{trialDaysRemaining}d</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className="text-2xl font-bold text-muted-foreground">Não</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isPaidUp ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold text-green-600">OK</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className="text-2xl font-bold text-muted-foreground">Free</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Modo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {preferences?.user_mode === 'personal' ? 'Vendedor' : preferences?.user_mode === 'organization' ? 'Empresa' : 'NULL'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Usuário
            </CardTitle>
            <CardDescription>Informações de autenticação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">ID</div>
              <div className="font-mono text-sm">{user?.id}</div>
            </div>
            <Separator />
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="font-mono text-sm">{user?.email}</div>
            </div>
            <Separator />
            <div>
              <div className="text-xs text-muted-foreground">Criado em</div>
              <div className="text-sm">{user?.created_at ? new Date(user.created_at).toLocaleString('pt-BR') : 'N/A'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil
            </CardTitle>
            <CardDescription>Dados do perfil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Nome</div>
              <div className="text-sm">{profile?.full_name || 'N/A'}</div>
            </div>
            <Separator />
            <div>
              <div className="text-xs text-muted-foreground">Super Admin</div>
              <Badge variant={profile?.is_super_admin ? 'default' : 'secondary'}>
                {profile?.is_super_admin ? 'Sim' : 'Não'}
              </Badge>
            </div>
            <Separator />
            <div>
              <div className="text-xs text-muted-foreground">Organization ID</div>
              <div className="font-mono text-sm">{profile?.organization_id || 'null'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Assinatura
            </CardTitle>
            <CardDescription>user_subscriptions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Plan Group</div>
              <Badge variant="outline" className="uppercase">{subscription?.plan_group || 'N/A'}</Badge>
            </div>
            <Separator />
            <div>
              <div className="text-xs text-muted-foreground">Tipo</div>
              <Badge variant="secondary">{subscription?.is_annual ? 'Anual' : 'Mensal'}</Badge>
            </div>
            <Separator />
            <div>
              <div className="text-xs text-muted-foreground">Trial Start</div>
              <div className="text-sm">{subscription?.trial_start_date ? new Date(subscription.trial_start_date).toLocaleString('pt-BR') : 'N/A'}</div>
            </div>
            <Separator />
            <div>
              <div className="text-xs text-muted-foreground">Trial Period (dias)</div>
              <div className="text-sm">{subscription?.trial_period_days || 'N/A'}</div>
            </div>
            <Separator />
            <div>
              <div className="text-xs text-muted-foreground">Current Period End</div>
              <div className="text-sm">{subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleString('pt-BR') : 'N/A'}</div>
            </div>
            <Separator />
            <div>
              <div className="text-xs text-muted-foreground">Asaas Subscription ID</div>
              <div className="font-mono text-xs break-all">{subscription?.asaas_subscription_id || 'null'}</div>
            </div>
            <Separator />
            <div>
              <div className="text-xs text-muted-foreground">Asaas Customer ID</div>
              <div className="font-mono text-xs break-all">{subscription?.asaas_customer_id || 'null'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Preferências
            </CardTitle>
            <CardDescription>user_preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">User Mode</div>
              <Badge variant={preferences?.user_mode === 'personal' ? 'default' : 'secondary'}>
                {preferences?.user_mode || 'null'}
              </Badge>
            </div>
            <Separator />
            <div>
              <div className="text-xs text-muted-foreground">Criado em</div>
              <div className="text-sm">{preferences?.created_at ? new Date(preferences.created_at).toLocaleString('pt-BR') : 'N/A'}</div>
            </div>
            <Separator />
            <div>
              <div className="text-xs text-muted-foreground">Atualizado em</div>
              <div className="text-sm">{preferences?.updated_at ? new Date(preferences.updated_at).toLocaleString('pt-BR') : 'N/A'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Estatísticas de Uso
            </CardTitle>
            <CardDescription>usage_stats</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Vendas (mês atual)</div>
              <div className="text-2xl font-bold">{usageStats?.sales_count_current_month || 0}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Fornecedores</div>
              <div className="text-2xl font-bold">{usageStats?.suppliers_count || 0}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Usuários</div>
              <div className="text-2xl font-bold">{usageStats?.users_count || 0}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Computed Values */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Valores Computados
          </CardTitle>
          <CardDescription>Calculados em tempo real</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Trial Ativo?</div>
            <Badge variant={trialActive ? 'default' : 'secondary'}>
              {trialActive ? 'SIM' : 'NÃO'}
            </Badge>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Dias Restantes Trial</div>
            <div className="text-2xl font-bold">{trialDaysRemaining}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Pagamento OK?</div>
            <Badge variant={isPaidUp ? 'default' : 'secondary'}>
              {isPaidUp ? 'SIM' : 'NÃO'}
            </Badge>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Plano Efetivo</div>
            <Badge className="uppercase text-lg px-3 py-1">
              {effectivePlan}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Raw JSON */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Data (JSON)</CardTitle>
          <CardDescription>Dados brutos das tabelas</CardDescription>
        </CardHeader>
        <CardContent>
          <details className="cursor-pointer">
            <summary className="font-semibold mb-2">user_subscriptions</summary>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(subscription, null, 2)}
            </pre>
          </details>
          <Separator className="my-4" />
          <details className="cursor-pointer">
            <summary className="font-semibold mb-2">user_preferences</summary>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(preferences, null, 2)}
            </pre>
          </details>
          <Separator className="my-4" />
          <details className="cursor-pointer">
            <summary className="font-semibold mb-2">usage_stats</summary>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(usageStats, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}
