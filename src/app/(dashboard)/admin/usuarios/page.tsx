import { Suspense } from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { listAllUsers } from '@/app/actions/admin'
import { UsersClient } from './client'
import { Skeleton } from '@/components/ui/skeleton'
import { FadeIn } from '@/components/ui/fade-in'

export const metadata: Metadata = {
  title: 'Usuários | Admin',
  description: 'Gerenciamento de usuários do sistema',
}

async function AdminUsersContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar se é super admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('user_id', user.id)
    .single()

  if (!profile?.is_super_admin) {
    redirect('/home')
  }

  const initialResult = await listAllUsers(1, 10)
  const initialData = initialResult.success ? initialResult.data : { users: [], total: 0 }

  return <FadeIn><UsersClient initialData={initialData} /></FadeIn>
}

function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      <Skeleton className="h-[500px] w-full" />
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<AdminUsersLoading />}>
      <AdminUsersContent />
    </Suspense>
  )
}
