'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useUser } from '@/contexts/app-data-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Pencil, Eye, EyeOff, Server, Copy, Check, ArrowRight, Shield, Mail, User, CreditCard, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { useState, useEffect } from 'react'
import { ProfileForm } from '@/components/profile/profile-form'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { getEnvironmentVariables, EnvironmentVariable } from '@/app/actions/profiles'
import { getSubscription } from '@/app/actions/billing'
import { useCurrentUser } from '@/contexts/current-user-context'
import { updateUserMode } from '@/app/actions/user-preferences'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/components/ui/item'

interface SubscriptionInfo {
  planName: string
  status: string
}

type MenuSection = 'menu' | 'perfil' | 'seguranca' | 'plano'

export default function MinhaContaPage() {
  const { signOut, user, linkIdentity } = useAuth()
  const { profile } = useUser()
  const router = useRouter()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([])
  const [envVarsLoading, setEnvVarsLoading] = useState(false)
  const [envVarsOpen, setEnvVarsOpen] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [userMode, setUserMode] = useState<'personal' | 'organization' | null>(null)
  const [isUpdatingMode, setIsUpdatingMode] = useState(false)
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<MenuSection>('menu')
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const identities = user?.identities || []
  const hasGoogle = identities.some(id => id.provider === 'google')
  const hasPassword = identities.some(id => id.provider === 'email')

  const handleLinkGoogle = async () => {
    try {
      setIsLinkingGoogle(true)
      await linkIdentity('google', '/minhaconta')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao vincular conta Google')
    } finally {
      setIsLinkingGoogle(false)
    }
  }

  const { currentUser } = useCurrentUser()

  useEffect(() => {
    async function loadInitialData() {
      if (!user?.id) return

      const sub = await getSubscription(user.id)

      if (sub) {
        setSubscription({
          planName: (sub.plan_snapshot as { name?: string })?.name || 'Plano',
          status: sub.status
        })
      }
    }
    loadInitialData()
  }, [user?.id])

  useEffect(() => {
    if (currentUser?.preferences) {
      setUserMode(currentUser.preferences.user_mode)
    }
  }, [currentUser?.preferences])

  const { refresh: refreshCurrentUser } = useCurrentUser()

  const handleModeChange = async (mode: string) => {
    const newMode = mode as 'personal' | 'organization'
    if (newMode === userMode || isUpdatingMode) return

    setIsUpdatingMode(true)
    const result = await updateUserMode(newMode)

    if (result.success) {
      await refreshCurrentUser()
      setUserMode(newMode)
      toast.success(`Modo alterado para ${newMode === 'personal' ? 'Vendedor' : 'Organização'}`)
      // Redireciona para a home correta do modo
      router.push(newMode === 'personal' ? '/home' : '/')
      router.refresh()
    } else {
      toast.error(result.error)
    }
    setIsUpdatingMode(false)
  }

  const loadEnvVars = async () => {
    if (envVars.length > 0) return // já carregou
    setEnvVarsLoading(true)
    const result = await getEnvironmentVariables()
    if (result.success && result.data) {
      setEnvVars(result.data)
    }
    setEnvVarsLoading(false)
  }

  const handleEnvVarsToggle = (open: boolean) => {
    setEnvVarsOpen(open)
    if (open) loadEnvVars()
  }

  const maskValue = (value: string | undefined) => {
    if (!value) return '(não configurada)'
    if (value.length <= 12) return '••••••••'
    return `${value.slice(0, 6)}...${value.slice(-6)}`
  }

  const copyToClipboard = async (key: string, value: string | undefined) => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const formatDocument = (value: string | null) => {
    if (!value) return ''
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    } else {
      return digits
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
  }

  const name = profile?.name || 'Sem nome'
  const initials = name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || profile?.email?.[0].toUpperCase() || '?'

  const isOrganizationEnabled = process.env.NEXT_PUBLIC_ENABLE_ORGANIZATION === 'true'

  const menuItems = [
    {
      id: 'perfil' as MenuSection,
      icon: User,
      title: 'Perfil',
      description: 'Informações da sua conta e documentos'
    },
    {
      id: 'seguranca' as MenuSection,
      icon: Shield,
      title: 'Segurança e Acesso',
      description: 'Gerencie como você acessa sua conta'
    },
    {
      id: 'plano' as MenuSection,
      icon: CreditCard,
      title: 'Meu Plano e Faturamento',
      description: 'Gerencie sua assinatura e limites'
    }
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Minha Conta"
        description="Gerencie suas informações"
      />

      <div className="relative overflow-hidden">
        {/* Menu List */}
        <div
          className={`transition-transform duration-300 ease-in-out ${activeSection !== 'menu' ? '-translate-x-full absolute inset-0' : 'translate-x-0'
            }`}
        >
          <ItemGroup className="gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Item
                  key={item.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setActiveSection(item.id)}
                >
                  <ItemMedia variant="icon">
                    <Icon className="h-5 w-5" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{item.title}</ItemTitle>
                    <ItemDescription>{item.description}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </ItemActions>
                </Item>
              )
            })}
          </ItemGroup>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <Button variant="destructive" onClick={signOut} className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Sair da conta
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Content Sections */}
        {activeSection !== 'menu' && (
          <div className="animate-in slide-in-from-right duration-300">
            {/* Back Button Header */}
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 -ml-2"
              onClick={() => setActiveSection('menu')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>

            {/* Perfil Section */}
            {activeSection === 'perfil' && (
              <div className="space-y-6">
                {/* Profile Card - Improved Design */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 ring-2 ring-border">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold">{name}</h3>
                            {profile?.is_super_admin && (
                              <Badge variant="secondary" className="text-xs">Admin</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{profile?.email}</p>
                        </div>
                      </div>

                      {/* Mobile: Drawer - Desktop: Dialog */}
                      {isMobile ? (
                        // Mobile Drawer
                        <Drawer open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen}>
                          <DrawerTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DrawerTrigger>
                          <DrawerContent className="h-[90vh] flex flex-col">
                            <DrawerHeader className="flex-none">
                              <DrawerTitle>Editar Perfil</DrawerTitle>
                              <DrawerDescription>
                                Atualize suas informações de faturamento e nome.
                              </DrawerDescription>
                            </DrawerHeader>
                            <div className="flex-1 px-4 py-4 overflow-y-auto">
                              <ProfileForm onSuccess={() => setIsEditDrawerOpen(false)} hideButton />
                            </div>
                            <DrawerFooter className="flex-none border-t pt-4">
                              <Button type="submit" form="profile-form" className="w-full h-12 text-base">
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Alterações
                              </Button>
                            </DrawerFooter>
                          </DrawerContent>
                        </Drawer>
                      ) : (
                        // Desktop Dialog
                        <Dialog open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Editar Perfil</DialogTitle>
                              <DialogDescription>
                                Atualize suas informações de faturamento e nome.
                              </DialogDescription>
                            </DialogHeader>
                            <ProfileForm onSuccess={() => setIsEditDrawerOpen(false)} />
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    {profile?.document && (
                      <div className="pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Documento</p>
                            <p className="text-sm font-medium">{profile.document_type}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Número</p>
                            <p className="text-sm font-medium">{formatDocument(profile.document)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {isOrganizationEnabled && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Modo de Visualização</CardTitle>
                      <CardDescription>Escolha como deseja utilizar o sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userMode === null ? (
                        <div className="space-y-2">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ) : (
                        <>
                          <Tabs value={userMode} onValueChange={handleModeChange}>
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="personal" disabled={isUpdatingMode}>
                                Vendedor
                              </TabsTrigger>
                              <TabsTrigger value="organization" disabled={isUpdatingMode}>
                                Organização
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                          <p className="text-xs text-muted-foreground mt-3">
                            {userMode === 'personal'
                              ? 'Você está vendo suas vendas e comissões pessoais.'
                              : 'Você está vendo a gestão da sua equipe e organização.'}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Seção exclusiva para Super Admin */}
                {profile?.is_super_admin && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        Variáveis de Ambiente
                      </CardTitle>
                      <CardDescription>
                        Visualize as configurações do ambiente atual (apenas super admin)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Collapsible open={envVarsOpen} onOpenChange={handleEnvVarsToggle}>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            {envVarsOpen ? 'Ocultar variáveis' : 'Mostrar variáveis'}
                            {envVarsOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4">
                          {envVarsLoading ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-muted-foreground">
                                  {showSecrets ? 'Valores visíveis' : 'Valores mascarados'}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowSecrets(!showSecrets)}
                                >
                                  {showSecrets ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                                  {showSecrets ? 'Mascarar' : 'Revelar'}
                                </Button>
                              </div>
                              {envVars.map((env) => (
                                <div
                                  key={env.key}
                                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <code className="text-sm font-medium">{env.key}</code>
                                      {env.isPublic && (
                                        <Badge variant="outline" className="text-xs">PUBLIC</Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate mt-1">
                                      {showSecrets ? (env.value || '(não configurada)') : maskValue(env.value)}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-2 flex-shrink-0"
                                    onClick={() => copyToClipboard(env.key, env.value)}
                                    disabled={!env.value}
                                  >
                                    {copiedKey === env.key ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Segurança Section */}
            {activeSection === 'seguranca' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Segurança e Acesso
                  </CardTitle>
                  <CardDescription>Gerencie como você acessa sua conta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {/* Método Google */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/10">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-full border shadow-sm">
                          <svg viewBox="0 0 24 24" className="h-5 w-5">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Conta Google</p>
                          <p className="text-xs text-muted-foreground">
                            {hasGoogle ? 'Sua conta está vinculada' : 'Acesse com um clique via Google'}
                          </p>
                        </div>
                      </div>
                      {hasGoogle ? (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                          <Check className="h-3 w-3 mr-1" />
                          Conectado
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleLinkGoogle}
                          disabled={isLinkingGoogle}
                        >
                          {isLinkingGoogle ? 'Conectando...' : 'Vincular'}
                        </Button>
                      )}
                    </div>

                    {/* Método Email/Senha */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/10">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-full">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Email e Senha</p>
                          <p className="text-xs text-muted-foreground">
                            Acesso tradicional via email
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {hasPassword && (
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                            Ativo
                          </Badge>
                        )}
                        {!hasPassword && !hasGoogle && (
                          <Badge variant="secondary">Método atual</Badge>
                        )}
                        {hasPassword && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href="/reset-password">
                              Alterar
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {!hasPassword && hasGoogle && (
                    <p className="text-[10px] text-muted-foreground italic text-center">
                      Você está autenticado via Google. Não é necessário criar uma senha uComis.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Plano Section */}
            {activeSection === 'plano' && (
              <Card>
                <CardHeader>
                  <CardTitle>Plano e Faturamento</CardTitle>
                  <CardDescription>Gerencie sua assinatura e limites</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div>
                      <p className="font-semibold">
                        Plano Atual: {subscription?.planName || 'FREE'}
                        {subscription?.status === 'past_due' && (
                          <Badge variant="destructive" className="ml-2">Pendente</Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {subscription
                          ? `Sua assinatura está ${subscription.status === 'active' ? 'ativa' : 'pendente de pagamento'}.`
                          : 'Você está usando a versão gratuita com limites reduzidos.'
                        }
                      </p>
                    </div>
                    <Button variant="default" size="sm" onClick={() => setIsPlanModalOpen(true)}>
                      {subscription ? 'Gerenciar Plano' : 'Fazer Upgrade'}
                    </Button>
                  </div>
                  {subscription && (
                    <div className="pt-2">
                      <Button variant="link" className="p-0 h-auto text-primary gap-1" asChild>
                        <Link href="/cobrancas">
                          Ver histórico de faturas e pagamentos
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

