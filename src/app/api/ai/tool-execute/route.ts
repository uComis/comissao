import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createPersonalSale } from '@/app/actions/personal-sales'

export async function POST(req: NextRequest) {
  try {
    const { tool_name, preview, conversation_id } = await req.json()

    // Auth check
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (tool_name !== 'create_sale') {
      return NextResponse.json({ error: 'Tool não suportada' }, { status: 400 })
    }

    if (!preview?.supplier_id || !preview?.client_id || !preview?.gross_value) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Call existing server action with preview data
    const result = await createPersonalSale({
      supplier_id: preview.supplier_id,
      client_id: preview.client_id,
      client_name: preview.client_name,
      sale_date: preview.sale_date,
      gross_value: preview.gross_value,
      tax_rate: preview.tax_rate || 0,
      notes: preview.notes || undefined,
    })

    if (!result.success) {
      // Save error result in conversation (fire-and-forget)
      if (conversation_id) {
        const toolResult = `[TOOL_RESULT:create_sale]${JSON.stringify({ success: false, error: result.error })}`
        supabase
          .from('ai_messages')
          .insert({ conversation_id, role: 'assistant', content: toolResult })
          .then(({ error }) => { if (error) console.error('Save tool result error:', error) })
      }

      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const saleId = result.data.id

    // Save success result in conversation (fire-and-forget)
    if (conversation_id) {
      const toolResult = `[TOOL_RESULT:create_sale]${JSON.stringify({ success: true, sale_id: saleId })}`
      supabase
        .from('ai_messages')
        .insert({ conversation_id, role: 'assistant', content: toolResult })
        .then(({ error }) => { if (error) console.error('Save tool result error:', error) })
    }

    return NextResponse.json({ success: true, sale_id: saleId })
  } catch (error: any) {
    console.error('Tool execute error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
