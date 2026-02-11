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
- Nunca invente dados — use apenas o que está nas seções abaixo

Formatação:
- Use **negrito** para destacar termos importantes, nomes de telas e valores
- Use listas numeradas para passo a passo
- Use bullet points para listar opções ou itens
- Use emojis para dar contexto visual aos conceitos:
  📁 Pasta/Fornecedor | 👤 Cliente | 🛒 Venda | 💰 Comissão
  💵 Recebível/Faturamento | 🎯 Meta | ⚠️ Atenção | 💡 Dica
  📋 Passo a passo | ✅ Concluído | 📊 Relatório/Faixa
- Não exagere nos emojis — use 1-2 por parágrafo, nos pontos-chave`

export async function POST(req: NextRequest) {
  try {
    const { messages, conversation_id: incomingConvId } = await req.json()

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

    // 3. Conversation persistence: resolve or create conversation
    let conversationId: string | null = incomingConvId || null
    const userMessage = messages[messages.length - 1]?.content || ''
    const isFirstMessage = !incomingConvId

    if (!conversationId) {
      // Create new conversation
      const { data: conv } = await supabase
        .from('ai_conversations')
        .insert({ user_id: user.id, title: userMessage.slice(0, 50) || 'Nova conversa' })
        .select('id')
        .single()
      conversationId = conv?.id || null
    }

    // Save user message
    if (conversationId) {
      await supabase
        .from('ai_messages')
        .insert({ conversation_id: conversationId, role: 'user', content: userMessage })
        .then(({ error }) => { if (error) console.error('Save user msg error:', error) })

      // Update title on first message of existing conversation only if it was auto-created
      if (isFirstMessage && conversationId) {
        await supabase
          .from('ai_conversations')
          .update({ title: userMessage.slice(0, 50) || 'Nova conversa' })
          .eq('id', conversationId)
          .then(({ error }) => { if (error) console.error('Update title error:', error) })
      }
    }

    // 4. Real data context
    const context = await getUserContext(supabase, user, profile)

    // 5. System prompt: identity + knowledge + real data
    const dataBlock = formatForPrompt(context)
    const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\n${KAI_KNOWLEDGE}\n\n# Dados Reais do Usuário\n\n${dataBlock}`

    // 6. Stream via AI client
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
    const finalConvId = conversationId
    const sseStream = new ReadableStream({
      async start(controller) {
        try {
          // First SSE event: conversation_id so client can track it
          if (finalConvId) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ conversation_id: finalConvId })}\n\n`)
            )
          }

          const reader = aiStream.getReader()
          let fullAssistantText = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            fullAssistantText += value.text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: value.text })}\n\n`)
            )
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))

          // Save assistant message (fire-and-forget)
          if (finalConvId && fullAssistantText) {
            supabase
              .from('ai_messages')
              .insert({ conversation_id: finalConvId, role: 'assistant', content: fullAssistantText })
              .then(({ error }) => { if (error) console.error('Save assistant msg error:', error) })

            supabase
              .from('ai_conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', finalConvId)
              .then(({ error }) => { if (error) console.error('Update conv timestamp error:', error) })
          }

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
