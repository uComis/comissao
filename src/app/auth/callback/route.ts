import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/home'

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6c85f2db-ad14-45fb-be8d-7bd896d4680c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'callback/route.ts:GET:entry',message:'Auth callback chamado',data:{code:code?'present':'absent',token_hash:token_hash?'present':'absent',type,next,fullUrl:request.url},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
  // #endregion

  const supabase = await createClient()

  // Processar token_hash (magic link do admin/impersonation)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6c85f2db-ad14-45fb-be8d-7bd896d4680c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'callback/route.ts:verifyOtp',message:'Resultado verifyOtp',data:{error:error?.message,success:!error},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    console.error('Auth callback verifyOtp error:', error)
    return NextResponse.redirect(`${origin}/login?error=auth_callback&message=${encodeURIComponent(error.message)}`)
  }

  // Processar code (OAuth/PKCE flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6c85f2db-ad14-45fb-be8d-7bd896d4680c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'callback/route.ts:exchangeCode',message:'Resultado exchangeCodeForSession',data:{error:error?.message,success:!error},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${origin}${next}?error=auth_callback&message=${encodeURIComponent(error.message)}`)
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6c85f2db-ad14-45fb-be8d-7bd896d4680c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'callback/route.ts:noCode',message:'Callback sem code nem token_hash - redirecionando',data:{next},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
  // #endregion

  // Se cair aqui sem 'code' nem 'token_hash', pode ser um erro
  return NextResponse.redirect(`${origin}${next}`)
}

