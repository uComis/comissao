'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

/**
 * Server Actions para administração (super admin only)
 */

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

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

/**
 * Verifica se o usuário atual é super admin
 */
async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Não autenticado')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('user_id', user.id)
    .single()

  if (!profile?.is_super_admin) {
    throw new Error('Acesso negado: requer super admin')
  }

  return user
}

/**
 * Lista todos os usuários do sistema (super admin only)
 */
export async function listAllUsers(
  page: number = 1,
  pageSize: number = 20,
  search?: string
): Promise<ActionResult<{ users: AdminUser[]; total: number }>> {
  try {
    await requireSuperAdmin()
    
    const adminClient = createAdminClient()
    const offset = (page - 1) * pageSize

    // Se tem busca, primeiro encontrar user_ids que correspondem ao email
    let emailMatchedUserIds: string[] = []
    if (search) {
      const { data: emailMatches } = await adminClient
        .from('user_emails')
        .select('user_id')
        .ilike('email', `%${search}%`)
      
      emailMatchedUserIds = emailMatches?.map(e => e.user_id) || []
    }

    // Query base para buscar usuários com dados agregados
    let query = adminClient
      .from('profiles')
      .select(`
        id,
        user_id,
        full_name,
        avatar_url,
        is_super_admin,
        created_at
      `, { count: 'exact' })

    // Se tem busca, filtrar por nome OU por user_id (email match)
    if (search) {
      if (emailMatchedUserIds.length > 0) {
        // Buscar por nome OU por user_ids que deram match no email
        query = query.or(`full_name.ilike.%${search}%,user_id.in.(${emailMatchedUserIds.join(',')})`)
      } else {
        // Só buscar por nome
        query = query.ilike('full_name', `%${search}%`)
      }
    }

    // Paginação
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    const { data: profiles, count, error } = await query

    if (error) throw error

    // Buscar dados adicionais para todos os usuários em paralelo
    const profilesList = profiles || []
    const userIds = profilesList.map(p => p.user_id)

    // Executar todas as queries em paralelo (ao invés de N+1 sequencial)
    const [authResults, subscriptionsResult, suppliersResults, salesResults] = await Promise.all([
      // Auth data (email + last_sign_in) - paralelo por usuário
      Promise.all(userIds.map(id => adminClient.auth.admin.getUserById(id))),
      // Subscriptions - batch único
      adminClient
        .from('subscriptions')
        .select('user_id, plan_id, status, plans(name)')
        .in('user_id', userIds)
        .order('created_at', { ascending: false }),
      // Contagem de fornecedores - paralelo por usuário
      Promise.all(userIds.map(id =>
        adminClient
          .from('personal_suppliers')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', id)
          .then(r => ({ user_id: id, count: r.count || 0 }))
      )),
      // Contagem de vendas - paralelo por usuário
      Promise.all(userIds.map(id =>
        adminClient
          .from('personal_sales')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', id)
          .then(r => ({ user_id: id, count: r.count || 0 }))
      )),
    ])

    // Indexar resultados por user_id para lookup O(1)
    const authMap = new Map(authResults.map((r, i) => [userIds[i], r.data?.user]))
    const suppliersMap = new Map(suppliersResults.map(r => [r.user_id, r.count]))
    const salesMap = new Map(salesResults.map(r => [r.user_id, r.count]))

    // Subscriptions: pegar a mais recente por user_id (já ordenado por created_at desc)
    type SubscriptionRow = { user_id: string; plan_id: string | null; status: string | null; plans: { name: string }[] | null }
    const subscriptionMap = new Map<string, SubscriptionRow>()
    for (const sub of subscriptionsResult.data || []) {
      if (!subscriptionMap.has(sub.user_id)) {
        subscriptionMap.set(sub.user_id, sub)
      }
    }

    const users: AdminUser[] = profilesList.map(profile => {
      const authUser = authMap.get(profile.user_id)
      const subscription = subscriptionMap.get(profile.user_id)

      return {
        id: profile.user_id,
        email: authUser?.email || '',
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        is_super_admin: profile.is_super_admin || false,
        created_at: profile.created_at,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        plan_id: subscription?.plan_id || null,
        plan_name: subscription?.plans?.[0]?.name || null,
        subscription_status: subscription?.status || null,
        suppliers_count: suppliersMap.get(profile.user_id) || 0,
        sales_count: salesMap.get(profile.user_id) || 0,
      }
    })

    return { 
      success: true, 
      data: { 
        users, 
        total: count || 0 
      } 
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar usuários',
    }
  }
}

/**
 * Busca detalhes de um usuário específico (super admin only)
 */
export async function getUserDetails(userId: string): Promise<ActionResult<AdminUser>> {
  try {
    await requireSuperAdmin()
    
    const adminClient = createAdminClient()

    // Buscar perfil
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profileError) throw profileError

    // Buscar todos os dados adicionais em paralelo
    const [{ data: userData }, { data: subscription }, { count: suppliersCount }, { count: salesCount }] = await Promise.all([
      adminClient.auth.admin.getUserById(userId),
      adminClient
        .from('subscriptions')
        .select('plan_id, status, plans(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminClient
        .from('personal_suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      adminClient
        .from('personal_sales')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
    ])

    return {
      success: true,
      data: {
        id: userId,
        email: userData.user?.email || '',
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        is_super_admin: profile.is_super_admin || false,
        created_at: profile.created_at,
        last_sign_in_at: userData.user?.last_sign_in_at || null,
        plan_id: subscription?.plan_id || null,
        plan_name: (subscription?.plans as unknown as { name: string } | null)?.name || null,
        subscription_status: subscription?.status || null,
        suppliers_count: suppliersCount || 0,
        sales_count: salesCount || 0,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar usuário',
    }
  }
}

/**
 * Faz login como outro usuário (impersonation) - super admin only
 * Gera um magic link e redireciona para callback com token_hash
 */
export async function loginAsUser(userId: string): Promise<ActionResult<{ url: string }>> {
  try {
    await requireSuperAdmin()
    
    const adminClient = createAdminClient()

    // Buscar email do usuário alvo
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId)
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6c85f2db-ad14-45fb-be8d-7bd896d4680c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin.ts:loginAsUser:getUserById',message:'Resultado getUserById',data:{userId,userEmail:userData?.user?.email,userError:userError?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,E'})}).catch(()=>{});
    // #endregion
    
    if (userError || !userData.user?.email) {
      throw new Error('Usuário não encontrado')
    }

    // Gerar magic link para o usuário
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email,
    })

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6c85f2db-ad14-45fb-be8d-7bd896d4680c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin.ts:loginAsUser:generateLink',message:'Magic link gerado',data:{linkError:linkError?.message,hashedToken:linkData?.properties?.hashed_token ? 'present' : 'absent',email:linkData?.properties?.email_otp ? 'has_otp' : 'no_otp'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

    if (linkError || !linkData.properties?.hashed_token) {
      throw new Error('Erro ao gerar link de acesso')
    }

    // Construir URL do nosso callback com o token_hash
    // O callback usará verifyOtp para estabelecer a sessão
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL não configurada')
    }
    const callbackUrl = new URL(`${baseUrl}/auth/callback`)
    callbackUrl.searchParams.set('token_hash', linkData.properties.hashed_token)
    callbackUrl.searchParams.set('type', 'magiclink')
    callbackUrl.searchParams.set('next', '/home')

    return {
      success: true,
      data: { url: callbackUrl.toString() },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao fazer login como usuário',
    }
  }
}

