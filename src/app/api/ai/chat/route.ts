import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAiClient } from '@/lib/clients/ai'
import { KAI_KNOWLEDGE } from '@/lib/clients/ai/kai-knowledge'
import { getUserContext, formatForPrompt } from '@/lib/services/ai-context-service'

export const runtime = 'edge'
export const maxDuration = 30

const SYSTEM_PROMPT_BASE = `Você é Kai, assistente inteligente do uComis.

Suas funções:
- Responder perguntas sobre vendas, comissões e recebíveis do usuário
- Ajudar a interpretar relatórios e métricas
- Sugerir ações para melhorar resultados
- Explicar regras de comissão configuradas
- Guiar o usuário sobre como usar qualquer funcionalidade do sistema
- Explicar conceitos do domínio (pasta, representada, recebível, etc.)

Diretrizes:
- Seja direto e objetivo nas respostas
- Use português brasileiro
- Formate valores como moeda brasileira (R$)
- Quando tiver dados reais, use-os para responder com precisão
- Quando NÃO tiver dados sobre algo específico, diga que não tem essa informação disponível
- Se o usuário perguntar como fazer algo, guie passo a passo usando o conhecimento do sistema
- Se o usuário perguntar por que uma comissão tem determinado valor, explique baseando-se na regra da pasta
- Chame o usuário pelo nome (está nos dados abaixo)
- Nunca invente dados — use apenas o que está nas seções abaixo`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    // 1. Auth
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 2. Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, organizations(*)')
      .eq('user_id', user.id)
      .single()

    // 3. Real data context
    const context = await getUserContext(supabase, user, profile)

    // 4. System prompt: identity + knowledge + real data
    const dataBlock = formatForPrompt(context)
    const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\n${KAI_KNOWLEDGE}\n\n# Dados Reais do Usuário\n\n${dataBlock}`

    // 5. Stream via AI client
    const client = createAiClient({
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY!,
      defaultModel: 'gemini-2.5-flash',
    })

    const aiStream = await client.chat({
      model: 'gemini-2.5-flash',
      systemPrompt,
      messages,
    })

    // Convert AiStreamChunk → SSE text
    const encoder = new TextEncoder()
    const sseStream = new ReadableStream({
      async start(controller) {
        try {
          const reader = aiStream.getReader()
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: value.text })}\n\n`)
            )
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error: any) {
          console.error('[AI Backend] Stream error:', error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: error.message })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(sseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('AI Chat Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
