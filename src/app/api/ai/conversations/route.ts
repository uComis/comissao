import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limit = Number(req.nextUrl.searchParams.get('limit')) || 20

    const { data, error } = await supabase
      .from('ai_conversations')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('GET /api/ai/conversations error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({ user_id: user.id })
      .select('id, title')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('POST /api/ai/conversations error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
