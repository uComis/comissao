import { GoogleGenAI } from '@google/genai'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Allow streaming responses up to 30 seconds
export const runtime = 'edge'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    // Get user context
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Get user profile and organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, organizations(*)')
      .eq('user_id', user.id)
      .single()

    // Build system prompt with user context
    const systemPrompt = `Você é um assistente inteligente especializado em comissões de vendas.

Informações do usuário:
- Nome: ${profile?.full_name || 'Usuário'}
- Email: ${user.email}
- Organização: ${profile?.organizations?.name || 'Não informada'}
- Cargo: ${profile?.role || 'Não informado'}

Suas funções:
- Responder perguntas sobre vendas, comissões e recebíveis
- Ajudar a interpretar relatórios e métricas
- Sugerir ações para melhorar resultados
- Explicar regras de comissão configuradas

Diretrizes:
- Seja direto e objetivo nas respostas
- Use português brasileiro
- Formate valores como moeda brasileira (R$)
- Mencione quando não tiver dados suficientes para responder
- Se precisar de informações específicas, peça ao usuário

Importante: Você tem acesso LIMITADO aos dados reais do usuário nesta versão inicial. 
Se não tiver certeza, seja honesto e diga que precisa de mais informações.`

    // Initialize Google GenAI client
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    })

    // Format messages for Gemini API
    // Include system prompt as the first message
    const formattedMessages = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: 'Entendido! Estou pronto para ajudar com suas dúvidas sobre vendas e comissões.' }],
      },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }))
    ]

    // Generate content with streaming
    const response = ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: formattedMessages,
    })

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let chunkCount = 0
          
          // Await the response and iterate over chunks
          const result = await response
          
          for await (const chunk of result) {
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || ''
            chunkCount++
            
            if (text) {
              // Send as Server-Sent Event format
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }
          
          // Send done signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error: any) {
          console.error('[AI Backend] Stream error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
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
