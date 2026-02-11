import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // RLS ensures user can only access their own conversations' messages
    const { data, error } = await supabase
      .from('ai_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('GET /api/ai/conversations/[id]/messages error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
