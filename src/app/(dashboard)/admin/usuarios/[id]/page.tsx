import { Suspense } from 'react'
import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getUserDetails } from '@/app/actions/admin'
import { UserDetailsClient } from './client'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Detalhes do Usuário | Admin',
  description: 'Detalhes do usuário',
}

type Props = {
  params: Promise<{ id: string }>
}

async function UserDetailsContent({ id }: { id: string }) {
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

  // Buscar dados do usuário
  const result = await getUserDetails(id)
  
  if (!result.success) {
    notFound()
  }

  return <UserDetailsClient user={result.data} />
}

function UserDetailsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-[250px]" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}

export default async function UserDetailsPage({ params }: Props) {
  const { id } = await params

  return (
    <Suspense fallback={<UserDetailsLoading />}>
      <UserDetailsContent id={id} />
    </Suspense>
  )
}