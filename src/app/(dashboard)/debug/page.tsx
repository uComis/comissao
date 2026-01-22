import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { DebugClient } from './debug-client'

export default async function DebugPage() {
  const supabase = await createClient()
  
  // Verificar se está em modo debug
  const isLocalhost = process.env.NODE_ENV === 'development'
  const debugEnabled = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
  
  if (!isLocalhost || !debugEnabled) {
    redirect('/')
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Buscar dados de billing
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: usageStats } = await supabase
    .from('usage_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <DebugClient
      user={user}
      subscription={subscription}
      profile={profile}
      preferences={preferences}
      usageStats={usageStats}
    />
  )
}
