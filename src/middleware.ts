import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkAndHandleExpiredTrial } from './app/actions/billing'
import { startTimer, logDebug } from './lib/debug-timer'

// Rotas exclusivas de vendedor (modo personal)
const PERSONAL_ROUTES = ['/home', '/minhasvendas', '/fornecedores', '/recebiveis']

// Rotas exclusivas de empresa (modo organization)
const ORG_ROUTES = ['/dashboard', '/vendas', '/vendedores', '/regras', '/relatorios', '/configuracoes']

// Rotas acessíveis em qualquer modo (não devem forçar redirect por modo)
const NEUTRAL_ROUTES = ['/minhaconta']

// Rotas que não exigem modo definido
const PUBLIC_AUTH_ROUTES = [
  '/login', 
  '/cadastro',
  '/auth/cadastro',
  '/auth/recuperar-senha',
  '/onboarding', 
  '/auth/callback', 
  '/reset-password', 
  '/api/webhooks', 
  '/privacidade',
  '/termos',
  '/ajuda',
  '/faq',
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const hostname = request.nextUrl.hostname
  const timer = startTimer(`MIDDLEWARE ${pathname}`)

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6c85f2db-ad14-45fb-be8d-7bd896d4680c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'middleware.ts:entry', message: 'Middleware iniciado', data: { pathname, cookies: request.cookies.getAll().map(c => c.name) }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'C,D' }) }).catch(() => { });
  // #endregion

  const isAuthPage = pathname.startsWith('/login')
  const isOnboardingPage = pathname.startsWith('/onboarding')
  const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some(route => pathname.startsWith(route))

  // Se Supabase não está configurado, redireciona para login
  if (!supabaseUrl || !supabaseKey) {
    if (!isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const authTimer = startTimer('AUTH getSession')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user
  authTimer.end()

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6c85f2db-ad14-45fb-be8d-7bd896d4680c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'middleware.ts:getUser', message: 'Resultado getUser', data: { hasUser: !!user, userId: user?.id, userEmail: user?.email, pathname, isPublicAuthRoute }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'C,D' }) }).catch(() => { });
  // #endregion

  // Rotas públicas do site (landing, legal, etc.) - acessíveis sem login
  const SITE_PAGES = ['/', '/privacidade', '/termos', '/ajuda', '/faq']
  const isSitePage = SITE_PAGES.includes(pathname)

  // Se não está logado e acessa página do site, deixa ver
  if (!user && isSitePage) {
    return supabaseResponse
  }

  // Se não está logado e tenta acessar página protegida
  if (!user && !isPublicAuthRoute) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6c85f2db-ad14-45fb-be8d-7bd896d4680c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'middleware.ts:redirectToLogin', message: 'Redirecionando para login - sem usuario', data: { pathname }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'C' }) }).catch(() => { });
    // #endregion
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se está logado
  if (user) {
    // Verificar e processar trial expirado (não bloqueia a request)
    checkAndHandleExpiredTrial(user.id).catch(err => {
      console.error('Error handling expired trial:', err)
    })

    // ✅ OTIMIZAÇÃO: Ler user_mode de cookie em vez de query ao banco
    let userModeCookie = request.cookies.get('user_mode')?.value as 'personal' | 'organization' | undefined
    logDebug('COOKIE', `user_mode: ${userModeCookie || 'not found'}`)

    // Se não existe cookie, busca do banco e salva no cookie
    if (!userModeCookie) {
      const dbTimer = startTimer('DB QUERY user_preferences')
      const { data: pref } = await supabase
        .from('user_preferences')
        .select('user_mode')
        .eq('user_id', user.id)
        .single()
      dbTimer.end()

      if (pref?.user_mode) {
        userModeCookie = pref.user_mode
        // Salva cookie para próximas requisições
        supabaseResponse.cookies.set('user_mode', pref.user_mode, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 dias
          path: '/'
        })
      }
    }

    // ✅ DEFAULT: Se organization desabilitado e sem cookie, força personal
    const isOrgEnabled = process.env.NEXT_PUBLIC_ENABLE_ORGANIZATION === 'true'
    if (!userModeCookie && !isOrgEnabled) {
      userModeCookie = 'personal'
      // Salva cookie para não repetir lógica
      supabaseResponse.cookies.set('user_mode', 'personal', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        path: '/'
      })
    }

    // Se está na página de login, verificar modo e redirecionar
    if (isAuthPage) {
      const url = request.nextUrl.clone()

      if (!userModeCookie) {
        // Sem modo definido E organization habilitada → onboarding
        url.pathname = '/onboarding'
      } else if (userModeCookie === 'personal') {
        url.pathname = '/home'
      } else {
        url.pathname = '/dashboard'
      }

      return NextResponse.redirect(url)
    }
    
    // Se está em página protegida (não é auth/onboarding)
    if (!isPublicAuthRoute) {
      // Se não tem modo definido E organization habilitada → onboarding
      if (!userModeCookie && !isOnboardingPage) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }

      // Verificar se está tentando acessar rota do modo errado
      const isNeutralRoute = NEUTRAL_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
      const isPersonalRoute = PERSONAL_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
      const isOrgRoute = ORG_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))

      if (!isNeutralRoute && userModeCookie === 'personal' && isOrgRoute) {
        // Vendedor tentando acessar rota de empresa
        const url = request.nextUrl.clone()
        url.pathname = '/home'
        return NextResponse.redirect(url)
      }

      if (!isNeutralRoute && userModeCookie === 'organization' && isPersonalRoute) {
        // Empresa tentando acessar rota de vendedor
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  timer.end()
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|woff|woff2|ttf|otf)$).*)',
  ],
}
