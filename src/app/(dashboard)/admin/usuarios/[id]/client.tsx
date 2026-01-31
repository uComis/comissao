'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { LogIn, Building2, ShoppingCart, Calendar, Mail, Shield, Loader2 } from 'lucide-react'
import { useSetPageHeader, useHeaderActions } from '@/components/layout'
import { loginAsUser } from '@/app/actions/admin'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type AdminUser = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  is_super_admin: boolean
  created_at: string
  last_sign_in_at: string | null
  plan_id: string | null
  plan_name: string | null
  subscription_status: string | null
  suppliers_count: number
  sales_count: number
}

type Props = {
  user: AdminUser
}

export function UserDetailsClient({ user }: Props) {
  const router = useRouter()
  const [showImpersonateDialog, setShowImpersonateDialog] = useState(false)
  const [impersonating, setImpersonating] = useState(false)

  useSetPageHeader({ title: 'Detalhes do Usuário', description: 'Informações completas do usuário', backHref: '/admin/usuarios' })
  useHeaderActions(
    !user.is_super_admin ? (
      <Button onClick={() => setShowImpersonateDialog(true)}>
        <LogIn className="h-4 w-4 mr-2" />
        Logar como
      </Button>
    ) : null
  )

  const handleImpersonate = async () => {
    setImpersonating(true)
    const result = await loginAsUser(user.id)
    
    if (result.success) {
      window.location.href = result.data.url
    } else {
      toast.error(result.error)
      setImpersonating(false)
    }
    
    setShowImpersonateDialog(false)
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Ativo</Badge>
      case 'trialing':
        return <Badge variant="secondary">Trial</Badge>
      case 'past_due':
        return <Badge variant="destructive">Pendente</Badge>
      case 'canceled':
        return <Badge variant="outline">Cancelado</Badge>
      default:
        return <Badge variant="outline">Sem plano</Badge>
    }
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card Principal */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
            <CardDescription>Dados básicos do perfil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-lg">
                  {getInitials(user.full_name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-lg flex items-center gap-2">
                  {user.full_name || 'Sem nome'}
                  {user.is_super_admin && (
                    <Badge variant="outline">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
                <div className="text-muted-foreground flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">ID do Usuário</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">{user.id}</code>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Cadastrado em</span>
                <span>{format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Último acesso</span>
                <span>
                  {user.last_sign_in_at ? (
                    formatDistanceToNow(new Date(user.last_sign_in_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })
                  ) : (
                    'Nunca'
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Assinatura */}
        <Card>
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
            <CardDescription>Status do plano e limites</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">
                  {user.plan_name || 'Nenhum plano'}
                </div>
                <div className="text-muted-foreground text-sm">
                  Plano atual
                </div>
              </div>
              {getStatusBadge(user.subscription_status)}
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Pastas cadastradas
                </span>
                <span className="font-medium">{user.suppliers_count}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Vendas registradas
                </span>
                <span className="font-medium">{user.sales_count}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmação */}
      <AlertDialog open={showImpersonateDialog} onOpenChange={setShowImpersonateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logar como usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Você será deslogado da sua conta e logado como{' '}
              <strong>{user.full_name || user.email}</strong>.
              <br /><br />
              Para voltar à sua conta, faça logout e login novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={impersonating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImpersonate}
              disabled={impersonating}
            >
              {impersonating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

