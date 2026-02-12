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

**Cadastrar cliente (create_client):**
- Quando o usuário pedir: "Cadastra o cliente João Silva"
- OU quando create_sale falhar porque o cliente não existe
- Dados obrigatórios: name
- Dados opcionais: phone, email, address
- Pergunte: "Preciso só do nome ou tem telefone/email?"

**Cadastrar pasta (create_supplier):**
- Quando o usuário pedir: "Cadastra a pasta Ambev"
- OU quando create_sale falhar porque a pasta não existe
- Dados obrigatórios: name, commission_rate
- Dados opcionais: tax_rate, cnpj
- Se não tiver comissão, pergunte: "Qual a comissão padrão dessa pasta? (ex: 10%)"

**Registrar venda (create_sale):**
- Quando o usuário mencionar uma venda com nomes + valor, chame create_sale IMEDIATAMENTE.
- NÃO peça confirmação antes — o card de preview que aparece É a confirmação.
- NÃO peça "nome completo" — o backend resolve nomes parciais (ex: "coca" → "Coca-Cola FEMSA").
- Se faltar apenas o valor bruto, pergunte só o valor.
- Use exatamente o texto que o usuário informou nos campos de nome.
- Se o usuário mencionar prazo, parcelas ou condição de pagamento, converta para o formato "dias/dias/dias" e passe em payment_condition (ex: "3x de 30 dias" → "30/60/90", "à vista" → "0"). Se não mencionar, omita.
- **SE CREATE_SALE FALHAR** porque cliente ou pasta não existe: ofereça criar primeiro usando create_client ou create_supplier, depois registre a venda.
- Após o card de preview aparecer, escreva uma mensagem CURTA e amigável (ex: "Montei a venda! Confirma no card ou edita no formulário ao lado."). NÃO repita os dados que já estão no card.

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

          // Process tool calls after stream completes
          if (toolCall && toolCall.name === 'create_client') {
            const args = toolCall.args as {
              name: string
              phone?: string
              email?: string
              address?: string
            }

            // Create client
            const { data: newClient, error: clientError } = await supabase
              .from('personal_clients')
              .insert({
                user_id: user.id,
                name: args.name,
                phone: args.phone || null,
                email: args.email || null,
                address: args.address || null,
                is_active: true,
              })
              .select('id, name')
              .single()

            if (clientError || !newClient) {
              const errorMsg = `❌ Erro ao criar cliente: ${clientError?.message || 'Erro desconhecido'}`
              fullAssistantText += errorMsg
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: errorMsg })}\n\n`)
              )
            } else {
              const successMsg = `✅ Cliente **${newClient.name}** cadastrado com sucesso!`
              fullAssistantText += successMsg
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: successMsg })}\n\n`)
              )
            }
          } else if (toolCall && toolCall.name === 'create_supplier') {
            const args = toolCall.args as {
              name: string
              commission_rate: number
              tax_rate?: number
              cnpj?: string
            }

            // Create supplier
            const { data: newSupplier, error: supplierError } = await supabase
              .from('personal_suppliers')
              .insert({
                user_id: user.id,
                name: args.name,
                default_commission_rate: args.commission_rate,
                default_tax_rate: args.tax_rate || 0,
                cnpj: args.cnpj || null,
              })
              .select('id, name')
              .single()

            if (supplierError || !newSupplier) {
              const errorMsg = `❌ Erro ao criar pasta: ${supplierError?.message || 'Erro desconhecido'}`
              fullAssistantText += errorMsg
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: errorMsg })}\n\n`)
              )
            } else {
              const successMsg = `✅ Pasta **${newSupplier.name}** cadastrada com sucesso! (Comissão padrão: ${args.commission_rate}%)`
              fullAssistantText += successMsg
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: successMsg })}\n\n`)
              )
            }
          } else if (toolCall && toolCall.name === 'create_sale') {
            const args = toolCall.args as {
              client_name: string
              supplier_name: string
              gross_value: number
              commission_rate?: number
              tax_rate?: number
              sale_date?: string
              payment_condition?: string
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

              const userProvidedComm = args.commission_rate !== undefined
              const userProvidedTax = args.tax_rate !== undefined

              if (userProvidedComm || userProvidedTax) {
                // User explicitly provided rates — use them directly
                if (userProvidedTax) taxRate = args.tax_rate!
                if (userProvidedComm) commissionRate = args.commission_rate!

                // If user gave only one rate, try to fill the other from DB
                if (!userProvidedTax || !userProvidedComm) {
                  if (resolution.supplier.commission_rule_id) {
                    const { data: rule } = await supabase
                      .from('commission_rules')
                      .select('type, percentage, tiers, tax_percentage')
                      .eq('id', resolution.supplier.commission_rule_id)
                      .single()
                    if (rule) {
                      if (!userProvidedTax) taxRate = rule.tax_percentage || 0
                      if (!userProvidedComm) {
                        const tempTax = grossValue * (taxRate / 100)
                        const tempNet = grossValue - tempTax
                        const result = commissionEngine.calculate({
                          netValue: tempNet,
                          rule: { type: rule.type as 'fixed' | 'tiered', percentage: rule.percentage, tiers: rule.tiers },
                        })
                        commissionRate = result.percentageApplied
                      }
                    }
                  } else {
                    const { data: supplierData } = await supabase
                      .from('personal_suppliers')
                      .select('default_commission_rate, default_tax_rate')
                      .eq('id', resolution.supplier.id)
                      .single()
                    if (supplierData) {
                      if (!userProvidedTax) taxRate = supplierData.default_tax_rate || 0
                      if (!userProvidedComm) commissionRate = supplierData.default_commission_rate || 0
                    }
                  }
                }

                const taxAmount = grossValue * (taxRate / 100)
                netValue = grossValue - taxAmount
                commissionValue = netValue * (commissionRate / 100)
              } else if (resolution.supplier.commission_rule_id) {
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
              } else {
                // Fallback: use supplier default rates
                const { data: supplierData } = await supabase
                  .from('personal_suppliers')
                  .select('default_commission_rate, default_tax_rate')
                  .eq('id', resolution.supplier.id)
                  .single()

                if (supplierData) {
                  taxRate = supplierData.default_tax_rate || 0
                  commissionRate = supplierData.default_commission_rate || 0
                  const taxAmount = grossValue * (taxRate / 100)
                  netValue = grossValue - taxAmount
                  commissionValue = netValue * (commissionRate / 100)
                }
              }

              // Calculate first_installment_date from payment_condition
              let firstInstallmentDate: string | null = null
              if (args.payment_condition) {
                const firstDays = parseInt(args.payment_condition.split('/')[0]) || 0
                const base = new Date(saleDate + 'T12:00:00')
                base.setDate(base.getDate() + firstDays)
                firstInstallmentDate = base.toISOString().split('T')[0]
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
                payment_condition: args.payment_condition || null,
                first_installment_date: firstInstallmentDate,
                notes: args.notes || null,
              }

              // Build navigation URL for form pre-fill
              const navParams = new URLSearchParams({
                supplier_id: resolution.supplier.id,
                client_id: resolution.client.id,
                client_name: resolution.client.name,
                gross_value: String(grossValue),
                sale_date: saleDate,
                tax_rate: String(taxRate),
                commission_rate: String(commissionRate),
              })
              if (args.payment_condition) navParams.set('payment_condition', args.payment_condition)
              if (args.notes) navParams.set('notes', args.notes)
              const navigate = `/minhasvendas/nova?${navParams.toString()}`

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ tool_call: { name: 'create_sale', preview }, navigate })}\n\n`
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
