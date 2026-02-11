'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useHeaderActions } from '@/components/layout'
import { Search, MoreHorizontal, LogIn, Eye, Loader2 } from 'lucide-react'
import { listAllUsers, loginAsUser } from '@/app/actions/admin'
import { usePreferences } from '@/hooks/use-preferences'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
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
  initialData: { users: AdminUser[]; total: number }
}

export function UsersClient({ initialData }: Props) {
  const router = useRouter()
  const { preferences, setPreference } = usePreferences()
  const [users, setUsers] = useState<AdminUser[]>(initialData.users)
  const [total, setTotal] = useState(initialData.total)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [impersonateUser, setImpersonateUser] = useState<AdminUser | null>(null)
  const [impersonating, setImpersonating] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialMount = useRef(true)

  useHeaderActions(
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar por nome ou email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-64 pl-9"
      />
    </div>
  )

  const pageSize = preferences.adminUsersPageSize

  // Debounce da pesquisa
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [search])

  // Fetch only when user changes page/search/pageSize (not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      // If user has a custom pageSize different from the server default (10), refetch
      if (pageSize !== 10) {
        // fall through to fetch below
      } else {
        return
      }
    }

    let cancelled = false
    setLoading(true)
    listAllUsers(page, pageSize, debouncedSearch || undefined).then(result => {
      if (cancelled) return
      if (result.success) {
        setUsers(result.data.users)
        setTotal(result.data.total)
      } else {
        toast.error(result.error)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [page, pageSize, debouncedSearch])

  const handleImpersonate = async () => {
    if (!impersonateUser) return
    
    setImpersonating(true)
    const result = await loginAsUser(impersonateUser.id)
    
    if (result.success) {
      // Redireciona para o magic link
      window.location.href = result.data.url
    } else {
      toast.error(result.error)
      setImpersonating(false)
    }
    
    setImpersonateUser(null)
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
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum usuário encontrado
        </div>
      ) : (
        <>
          <Table>
              <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="text-center">Pastas</TableHead>
                <TableHead className="text-center">Vendas</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user.full_name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {user.full_name || 'Sem nome'}
                          {user.is_super_admin && (
                            <Badge variant="outline" className="text-xs">Admin</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(user.subscription_status)}
                      {user.plan_name && (
                        <div className="text-xs text-muted-foreground">
                          {user.plan_name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {user.suppliers_count}
                  </TableCell>
                  <TableCell className="text-center">
                    {user.sales_count}
                  </TableCell>
                  <TableCell>
                    {user.last_sign_in_at ? (
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(user.last_sign_in_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Nunca</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/usuarios/${user.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        {!user.is_super_admin && (
                          <DropdownMenuItem
                            onClick={() => setImpersonateUser(user)}
                          >
                            <LogIn className="h-4 w-4 mr-2" />
                            Logar como
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(size) => setPreference('adminUsersPageSize', size)}
          />
        </>
      )}

      {/* Dialog de confirmação de impersonation */}
      <AlertDialog open={!!impersonateUser} onOpenChange={() => setImpersonateUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logar como usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Você será deslogado da sua conta e logado como{' '}
              <strong>{impersonateUser?.full_name || impersonateUser?.email}</strong>.
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

