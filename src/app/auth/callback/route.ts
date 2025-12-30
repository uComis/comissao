import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    console.error('Auth callback error:', error)

    // Se falhar a troca do código (ou vínculo), volta para a origem com erro detalhado
    return NextResponse.redirect(`${origin}${next}?error=auth_callback&message=${encodeURIComponent(error.message)}`)
  }

  // Se cair aqui sem 'code', pode ser um erro direto do provedor no fragmento (#)
  // Preservamos o destino (next) para o front processar o hash
  return NextResponse.redirect(`${origin}${next}`)
}

