import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAiClient } from '@/lib/clients/ai'
import type { AiMessage, AiStreamChunk } from '@/lib/clients/ai/types'
import { KAI_KNOWLEDGE } from '@/lib/clients/ai/kai-knowledge'
import { KAI_TOOLS, QUERY_TOOL_NAMES } from '@/lib/clients/ai/kai-tools'
import {
  getBaseContext,
  formatBaseContext,
  fetchDashboardData,
  fetchSupplierList,
  fetchClientList,
  fetchReceivablesTotals,
  fetchHistoricalData,
  fetchRecentSales,
} from '@/lib/services/ai-context-service'
import { resolveNames } from '@/lib/services/ai-name-resolver'
import { searchReceivables } from '@/lib/services/ai-receivables-search'
import { checkDuplicate } from '@/lib/services/ai-duplicate-checker'
import { commissionEngine } from '@/lib/commission-engine'

export const runtime = 'edge'
export const maxDuration = 30

// Max query tool rounds before giving up (prevents infinite loops)
const MAX_QUERY_TURNS = 3

// =====================================================
// SYSTEM PROMPT
// =====================================================

const SYSTEM_PROMPT_BASE = `Você é Kai, assistente inteligente do uComis.

Suas funções:
- Responder perguntas sobre vendas, comissões e recebíveis do usuário
- Ajudar a interpretar relatórios e métricas
- Sugerir ações para melhorar resultados
- Explicar regras de comissão configuradas
- Guiar o usuário sobre como usar qualquer funcionalidade do sistema
- Explicar conceitos do domínio (pasta, representada, recebível, etc.)
- Registrar vendas, cadastrar clientes/pastas, e registrar recebimentos

## Como acessar dados do usuário

Você tem ferramentas de consulta para buscar dados reais sob demanda:
- **get_dashboard** — métricas do mês (comissão, vendas, financeiro, rankings)
- **get_supplier_list** — pastas/fornecedores com regras de comissão
- **get_client_list** — clientes cadastrados
- **get_receivables_summary** — totais de recebíveis (pendentes, vencidos, recebidos)
- **get_recent_sales** — últimas vendas (opcionalmente filtradas por cliente/pasta)
- **get_historical_data** — vendas/comissões de um período (requer date_from e date_to no formato YYYY-MM-DD)

**SEMPRE** chame a ferramenta de consulta apropriada antes de responder sobre dados. Nunca invente ou estime valores.

## Ações

**create_sale** — Registrar venda:
- Chame IMEDIATAMENTE quando houver nomes + valor — NÃO peça confirmação, o card de preview É a confirmação
- NÃO peça "nome completo" — o backend resolve nomes parciais (ex: "coca" → "Coca-Cola FEMSA")
- Se faltar apenas o valor, pergunte só o valor
- Se um nome é claramente uma empresa/marca conhecida como fornecedor (ex: Coca-Cola, Ambev, Nestlé), coloque como supplier_name mesmo que o usuário tenha dito "pro" ou "pra"
- "a Ambev comprou 3 mil" = venda de 3 mil pela pasta Ambev. Pergunte só o nome do cliente
- Se o usuário mencionar prazo/parcelas, converta para "dias/dias/dias" em payment_condition (ex: "3x de 30 dias" → "30/60/90", "à vista" → "0"). Se não mencionar, omita
- SEMPRE chame create_sale com os dados disponíveis. NUNCA gere mensagens de erro sobre nome não encontrado — o backend faz a resolução e retorna erros adequados
- **SE FALHAR** (cliente/pasta não existe): ofereça criar usando create_client ou create_supplier
- Após o card: mensagem CURTA ("Montei a venda! Confirma no card ou edita no formulário ao lado."). NÃO repita os dados

**search_receivables** — Registrar recebimento:
- Chame IMEDIATAMENTE quando o usuário mencionar que recebeu ou que um cliente pagou
- Converta períodos para datas YYYY-MM-DD (a data de hoje está nos dados abaixo)
- Se o usuário não especificar status, omita (busca pendentes + atrasadas por padrão)
- Após o card: mensagem CURTA
- **SE NÃO ENCONTRAR**: sugira alternativas (outro período, nome diferente)

**create_client** — Cadastrar cliente:
- Obrigatório: name. Opcional: phone, email, notes (observações)
- Pergunte: "Preciso só do nome ou tem telefone/email?"

**create_supplier** — Cadastrar pasta:
- Obrigatório: name, commission_rate. Opcional: tax_rate, cnpj
- Se falta comissão, pergunte: "Qual a comissão padrão dessa pasta? (ex: 10%)"

**navigate_to** — Navegar para uma página:
- Use quando o usuário pedir para ir a uma tela ou quando for útil direcioná-lo
- Páginas: home, vendas, nova_venda, faturamento, clientes, pastas, planos, conta, configuracoes, ajuda

## Regra de ouro sobre nomes
- O uComis é pessoal e intransferível. O ÚNICO vendedor é o dono da conta (o usuário).
- Nomes mencionados pelo usuário referem-se SEMPRE a clientes ou pastas, NUNCA a outros vendedores.
- "quanto a Ana vendeu?" = "quanto EU vendi para a cliente Ana?"
- "a Coca vendeu 5 mil" = "eu vendi 5 mil pela pasta Coca-Cola"
- Na dúvida, interprete como cliente primeiro. Use as ferramentas de consulta para verificar.

## Linguagem
- NUNCA exiba URLs, paths ou rotas técnicas (como /clientes, /minhasvendas, /faturamento) nas respostas
- Use apenas nomes amigáveis: "Minhas Vendas", "Meus Clientes", "Minhas Pastas", "Faturamento", "Planos", "Minha Conta", "Configurações"
- Se precisar direcionar o usuário a uma página, use a ferramenta navigate_to

## Diretrizes
- Direto e objetivo, em português brasileiro
- Formate valores como R$
- Use dados reais das ferramentas — nunca invente
- Chame o usuário pelo nome (está nos dados abaixo)
- Guie passo a passo quando pedirem como fazer algo
- Se o usuário perguntar por que uma comissão tem determinado valor, explique baseando-se na regra da pasta

## Formatação
- **Negrito** para termos importantes, nomes de telas e valores
- Listas numeradas para passo a passo, bullet points para opções
- Emojis com moderação (1-2 por parágrafo, nos pontos-chave):
  📁 Pasta/Fornecedor | 👤 Cliente | 🛒 Venda | 💰 Comissão
  💵 Recebível/Faturamento | 🎯 Meta | ⚠️ Atenção | 💡 Dica
  📋 Passo a passo | ✅ Concluído | 📊 Relatório/Faixa`

// =====================================================
// ROUTE HANDLER
// =====================================================

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

    // 4. Light base context (~200 tokens: name, email, counts, date)
    const baseCtx = await getBaseContext(supabase, user, profile)
    const dataBlock = formatBaseContext(baseCtx)

    // 5. System prompt: identity + knowledge + base context
    const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\n${KAI_KNOWLEDGE}\n\n# Dados do Usuário\n\n${dataBlock}`

    // 6. AI client
    const client = createAiClient({
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY!,
      defaultModel: 'gemini-2.5-flash',
    })

    // 7. Build AI message history from client messages
    const aiMessages: AiMessage[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // 8. Stream via SSE
    const encoder = new TextEncoder()
    const finalConvId = conversationId
    const sseStream = new ReadableStream({
      async start(controller) {
        try {
          // Emit conversation_id so the client can track it
          if (finalConvId) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ conversation_id: finalConvId })}\n\n`)
            )
          }

          // Helper: read an AI stream, forwarding text chunks via SSE
          const readAndStream = async (
            stream: ReadableStream<AiStreamChunk>
          ): Promise<{
            text: string
            toolCall: { name: string; args: Record<string, unknown> } | null
          }> => {
            const reader = stream.getReader()
            let text = ''
            let tc: { name: string; args: Record<string, unknown> } | null = null
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              if (value.type === 'text') {
                text += value.text
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: value.text })}\n\n`)
                )
              } else if (value.type === 'tool_call') {
                tc = value.toolCall
              }
            }
            return { text, toolCall: tc }
          }

          // --- First AI call ---
          let aiStream = await client.chat({
            model: 'gemini-2.5-flash',
            systemPrompt,
            messages: aiMessages,
            tools: KAI_TOOLS,
          })

          let { text: fullAssistantText, toolCall } = await readAndStream(aiStream)

          // --- Multi-turn query tool loop ---
          // When the model calls a query tool, execute it and feed the result back.
          // The model then generates a natural-language answer using the data.
          let queryRounds = 0
          while (toolCall && QUERY_TOOL_NAMES.has(toolCall.name) && queryRounds < MAX_QUERY_TURNS) {
            queryRounds++

            // Execute query tool
            let toolResult: string
            switch (toolCall.name) {
              case 'get_dashboard':
                toolResult = await fetchDashboardData()
                break
              case 'get_supplier_list':
                toolResult = await fetchSupplierList(supabase, user.id)
                break
              case 'get_client_list':
                toolResult = await fetchClientList(supabase, user.id)
                break
              case 'get_receivables_summary':
                toolResult = await fetchReceivablesTotals(supabase, user.id)
                break
              case 'get_recent_sales':
                toolResult = await fetchRecentSales(
                  supabase,
                  user.id,
                  (toolCall.args.client_name as string) || undefined,
                  (toolCall.args.supplier_name as string) || undefined,
                  (toolCall.args.limit as number) || 5,
                )
                break
              case 'get_historical_data':
                toolResult = await fetchHistoricalData(
                  supabase,
                  user.id,
                  (toolCall.args.date_from as string) || '',
                  (toolCall.args.date_to as string) || '',
                )
                break
              default:
                toolResult = JSON.stringify({ error: `Tool desconhecida: ${toolCall.name}` })
            }

            // Append tool interaction to message history for next call
            aiMessages.push({ role: 'tool_call', name: toolCall.name, args: toolCall.args })
            aiMessages.push({ role: 'tool_response', name: toolCall.name, content: toolResult })

            // Next AI call — model now has the data and can answer
            aiStream = await client.chat({
              model: 'gemini-2.5-flash',
              systemPrompt,
              messages: aiMessages,
              tools: KAI_TOOLS,
            })

            const result = await readAndStream(aiStream)
            fullAssistantText += result.text
            toolCall = result.toolCall
          }

          // --- Action tool handlers (side effects) ---
          if (toolCall && toolCall.name === 'create_client') {
            const args = toolCall.args as {
              name: string
              phone?: string
              email?: string
              notes?: string
            }

            // Check for duplicates before creating
            const dupCheck = await checkDuplicate(supabase, user.id, args.name, 'clients')

            if (dupCheck.hasDuplicate && dupCheck.match && dupCheck.match.score < 100) {
              // Similar name exists (score 70-99) — ask user
              const msg = `⚠️ Já existe um cliente chamado **${dupCheck.match.name}**. Deseja criar "${args.name}" mesmo assim?`
              fullAssistantText += msg
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: msg })}\n\n`)
              )
            } else {
              // No duplicate or exact same name (user knows it exists) — proceed
              const { data: newClient, error: clientError } = await supabase
                .from('personal_clients')
                .insert({
                  user_id: user.id,
                  name: args.name,
                  phone: args.phone || null,
                  email: args.email || null,
                  notes: args.notes || null,
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
            }
          } else if (toolCall && toolCall.name === 'create_supplier') {
            const args = toolCall.args as {
              name: string
              commission_rate: number
              tax_rate?: number
              cnpj?: string
            }

            // Check for duplicates before creating
            const dupCheck = await checkDuplicate(supabase, user.id, args.name, 'suppliers')

            if (dupCheck.hasDuplicate && dupCheck.match && dupCheck.match.score < 100) {
              // Similar name exists (score 70-99) — ask user
              const msg = `⚠️ Já existe uma pasta chamada **${dupCheck.match.name}**. Deseja criar "${args.name}" mesmo assim?`
              fullAssistantText += msg
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: msg })}\n\n`)
              )
            } else {
              // No duplicate or exact same name — proceed
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
              // Handle missing entities by offering to create them
              const missingClient = !resolution.client && resolution.errors.some(e => e.includes('cliente'))
              const missingSupplier = !resolution.supplier && resolution.errors.some(e => e.includes('pasta'))

              let responseText = ''

              if (missingClient && missingSupplier) {
                // Both missing
                const clientMatch = resolution.errors.find(e => e.includes('cliente'))?.match(/"([^"]+)"/)
                const supplierMatch = resolution.errors.find(e => e.includes('pasta'))?.match(/"([^"]+)"/)
                const clientName = clientMatch ? clientMatch[1] : 'informado'
                const supplierName = supplierMatch ? supplierMatch[1] : 'informada'

                responseText = `O cliente "${clientName}" e a pasta "${supplierName}" não foram encontrados.\n\n` +
                  `Vamos criar eles? Primeiro preciso cadastrar a pasta.\n\n` +
                  `📁 **Pasta ${supplierName}**: Qual a comissão padrão dessa pasta? (ex: 10 para 10%)`
              } else if (missingClient) {
                // Only client missing
                const clientMatch = resolution.errors.find(e => e.includes('cliente'))?.match(/"([^"]+)"/)
                const clientName = clientMatch ? clientMatch[1] : 'informado'

                responseText = `O cliente "${clientName}" não foi encontrado.\n\n` +
                  `Deseja criar ele? Preciso só do nome ou tem telefone/email para cadastrar também?`
              } else if (missingSupplier) {
                // Only supplier missing
                const supplierMatch = resolution.errors.find(e => e.includes('pasta'))?.match(/"([^"]+)"/)
                const supplierName = supplierMatch ? supplierMatch[1] : 'informada'

                responseText = `A pasta "${supplierName}" não foi encontrada.\n\n` +
                  `Deseja criar ela? Qual a comissão padrão dessa pasta? (ex: 10 para 10%)`
              } else {
                // Ambiguous names - show original errors
                responseText = resolution.errors.join('\n\n')
              }

              fullAssistantText += responseText
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: responseText })}\n\n`)
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
          } else if (toolCall && toolCall.name === 'navigate_to') {
            const PAGE_ROUTES: Record<string, { route: string; label: string }> = {
              home: { route: '/home', label: 'Home' },
              vendas: { route: '/minhasvendas', label: 'Minhas Vendas' },
              nova_venda: { route: '/minhasvendas/nova', label: 'Nova Venda' },
              faturamento: { route: '/faturamento', label: 'Faturamento' },
              clientes: { route: '/clientes', label: 'Meus Clientes' },
              pastas: { route: '/fornecedores', label: 'Minhas Pastas' },
              planos: { route: '/planos', label: 'Planos' },
              conta: { route: '/minhaconta', label: 'Minha Conta' },
              configuracoes: { route: '/configuracoes', label: 'Configurações' },
              ajuda: { route: '/ajuda', label: 'Ajuda' },
            }

            const page = (toolCall.args.page as string) || 'home'
            const target = PAGE_ROUTES[page] || PAGE_ROUTES.home

            // Emit navigation event
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ navigate: target.route })}\n\n`
              )
            )

            // Emit confirmation text
            const navMsg = `Abrindo **${target.label}**...`
            fullAssistantText += navMsg
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: navMsg })}\n\n`)
            )
          } else if (toolCall && toolCall.name === 'search_receivables') {
            const args = toolCall.args as {
              client_name?: string
              supplier_name?: string
              status?: 'pending' | 'overdue' | 'pending_and_overdue' | 'all'
              due_date_from?: string
              due_date_to?: string
              installment_number?: number
              sale_number?: number
            }

            const { receivables, errors: searchErrors } = await searchReceivables(
              supabase,
              user.id,
              args
            )

            if (searchErrors.length > 0) {
              const errorMsg = searchErrors.join('\n')
              fullAssistantText += errorMsg
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: errorMsg })}\n\n`)
              )
            } else if (receivables.length === 0) {
              const filters: string[] = []
              if (args.client_name) filters.push(`do cliente "${args.client_name}"`)
              if (args.supplier_name) filters.push(`da pasta "${args.supplier_name}"`)
              if (args.status === 'pending') filters.push('pendentes')
              else if (args.status === 'overdue') filters.push('atrasadas')
              else filters.push('pendentes ou atrasadas')
              if (args.due_date_from || args.due_date_to) filters.push('no período informado')

              const msg = `Não encontrei parcelas ${filters.join(' ')}.\n\nQuer que eu busque com outros filtros?`
              fullAssistantText += msg
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: msg })}\n\n`)
              )
            } else {
              // Send tool_call event with receivables for confirmation card
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ tool_call: { name: 'register_payment', receivables } })}\n\n`
                )
              )

              // Save tool call as special message
              if (finalConvId) {
                const toolContent = `[TOOL_CALL:register_payment]${JSON.stringify(receivables)}`
                supabase
                  .from('ai_messages')
                  .insert({ conversation_id: finalConvId, role: 'assistant', content: toolContent })
                  .then(({ error }) => { if (error) console.error('Save tool call msg error:', error) })
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))

          // Save assistant text message (if any)
          if (finalConvId && fullAssistantText) {
            supabase
              .from('ai_messages')
              .insert({ conversation_id: finalConvId, role: 'assistant', content: fullAssistantText })
              .then(({ error }) => { if (error) console.error('Save assistant msg error:', error) })
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
