import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas exclusivas de vendedor (modo personal)
const PERSONAL_ROUTES = ['/home', '/minhasvendas', '/fornecedores', '/recebiveis']

// Rotas exclusivas de empresa (modo organization)
const ORG_ROUTES = ['/', '/vendas', '/vendedores', '/regras', '/relatorios', '/configuracoes']

// Rotas acessíveis em qualquer modo (não devem forçar redirect por modo)
const NEUTRAL_ROUTES = ['/minhaconta']

// Rotas que não exigem modo definido
const PUBLIC_AUTH_ROUTES = ['/login', '/onboarding', '/auth/callback', '/reset-password', '/api/webhooks']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const pathname = request.nextUrl.pathname

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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Se não está logado e tenta acessar página protegida
  if (!user && !isPublicAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se está logado
  if (user) {
    // Se está na página de login, verificar modo e redirecionar
    if (isAuthPage) {
      // Buscar preferência do usuário
      const { data: pref } = await supabase
        .from('user_preferences')
        .select('user_mode')
        .eq('user_id', user.id)
        .single()

      const url = request.nextUrl.clone()

      if (!pref?.user_mode) {
        // Sem modo definido → onboarding
        url.pathname = '/onboarding'
      } else if (pref.user_mode === 'personal') {
        url.pathname = '/home'
      } else {
        url.pathname = '/'
      }

      return NextResponse.redirect(url)
    }

    // Se está em página protegida (não é auth/onboarding)
    if (!isPublicAuthRoute) {
      // Buscar preferência do usuário
      const { data: pref } = await supabase
        .from('user_preferences')
        .select('user_mode')
        .eq('user_id', user.id)
        .single()

      // Se não tem modo definido, redireciona para onboarding
      if (!pref?.user_mode && !isOnboardingPage) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }

      // Verificar se está tentando acessar rota do modo errado
      const isNeutralRoute = NEUTRAL_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
      const isPersonalRoute = PERSONAL_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
      const isOrgRoute = ORG_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))

      if (!isNeutralRoute && pref?.user_mode === 'personal' && isOrgRoute) {
        // Vendedor tentando acessar rota de empresa
        const url = request.nextUrl.clone()
        url.pathname = '/home'
        return NextResponse.redirect(url)
      }

      if (!isNeutralRoute && pref?.user_mode === 'organization' && isPersonalRoute) {
        // Empresa tentando acessar rota de vendedor
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }
  }

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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
