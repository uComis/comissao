import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAiClient } from '@/lib/clients/ai'
import { KAI_KNOWLEDGE } from '@/lib/clients/ai/kai-knowledge'
import { KAI_TOOLS } from '@/lib/clients/ai/kai-tools'
import { getUserContext, formatForPrompt } from '@/lib/services/ai-context-service'
import { resolveNames } from '@/lib/services/ai-name-resolver'
import { commissionEngine } from '@/lib/commission-engine'

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
- **Registrar vendas** quando o usuário pedir (usar a função create_sale)

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

Ações disponíveis:
- Quando o usuário pedir para registrar/cadastrar/criar uma venda, use a função create_sale.
- Antes de chamar create_sale, certifique-se de ter: nome do cliente, nome da pasta e valor bruto.
- Se faltar algum dado obrigatório, pergunte ao usuário antes de chamar a função.
- Nunca invente nomes de clientes ou pastas — use exatamente o que o usuário informar.

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
      tools: KAI_TOOLS,
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
          let toolCall: { name: string; args: Record<string, unknown> } | null = null

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            if (value.type === 'text') {
              fullAssistantText += value.text
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: value.text })}\n\n`)
              )
            } else if (value.type === 'tool_call') {
              toolCall = value.toolCall
            }
          }

          // Process tool call after stream completes
          if (toolCall && toolCall.name === 'create_sale') {
            const args = toolCall.args as {
              client_name: string
              supplier_name: string
              gross_value: number
              sale_date?: string
              notes?: string
            }

            // Resolve names
            const resolution = await resolveNames(
              supabase,
              user.id,
              args.client_name,
              args.supplier_name
            )

            if (resolution.errors.length > 0) {
              // Send resolution errors as text
              const errorText = resolution.errors.join('\n')
              fullAssistantText += errorText
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: errorText })}\n\n`)
              )
            } else if (resolution.client && resolution.supplier) {
              // Fetch commission rule for preview
              const saleDate = args.sale_date || new Date().toISOString().split('T')[0]
              const grossValue = args.gross_value
              let taxRate = 0
              let commissionRate = 0
              let commissionValue = 0
              let netValue = grossValue

              if (resolution.supplier.commission_rule_id) {
                const { data: rule } = await supabase
                  .from('commission_rules')
                  .select('type, percentage, tiers, tax_percentage')
                  .eq('id', resolution.supplier.commission_rule_id)
                  .single()

                if (rule) {
                  taxRate = rule.tax_percentage || 0
                  const taxAmount = grossValue * (taxRate / 100)
                  netValue = grossValue - taxAmount

                  const result = commissionEngine.calculate({
                    netValue,
                    rule: {
                      type: rule.type as 'fixed' | 'tiered',
                      percentage: rule.percentage,
                      tiers: rule.tiers,
                    },
                  })
                  commissionValue = result.amount
                  commissionRate = result.percentageApplied
                }
              }

              const preview = {
                supplier_id: resolution.supplier.id,
                supplier_name: resolution.supplier.name,
                client_id: resolution.client.id,
                client_name: resolution.client.name,
                sale_date: saleDate,
                gross_value: grossValue,
                tax_rate: taxRate,
                net_value: netValue,
                commission_rate: commissionRate,
                commission_value: commissionValue,
                notes: args.notes || null,
              }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ tool_call: { name: 'create_sale', preview } })}\n\n`
                )
              )

              // Save tool call as special message
              if (finalConvId) {
                const toolContent = `[TOOL_CALL:create_sale]${JSON.stringify(preview)}`
                supabase
                  .from('ai_messages')
                  .insert({ conversation_id: finalConvId, role: 'assistant', content: toolContent })
                  .then(({ error }) => { if (error) console.error('Save tool call msg error:', error) })
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))

          // Save assistant text message (if any, and not already saved as tool call)
          if (finalConvId && fullAssistantText && !toolCall) {
            supabase
              .from('ai_messages')
              .insert({ conversation_id: finalConvId, role: 'assistant', content: fullAssistantText })
              .then(({ error }) => { if (error) console.error('Save assistant msg error:', error) })
          }

          // Save text that came before a tool call (rare but possible)
          if (finalConvId && fullAssistantText && toolCall) {
            supabase
              .from('ai_messages')
              .insert({ conversation_id: finalConvId, role: 'assistant', content: fullAssistantText })
              .then(({ error }) => { if (error) console.error('Save pre-tool text error:', error) })
          }

          if (finalConvId) {
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
