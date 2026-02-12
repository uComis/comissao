// Provider Gemini (não depende do domínio do projeto)

import { GoogleGenAI } from '@google/genai'
import type { AiClient, AiChatOptions, AiStreamChunk } from './types'

export function createGeminiProvider(apiKey: string): AiClient {
  const ai = new GoogleGenAI({ apiKey })

  return {
    async chat(options: AiChatOptions): Promise<ReadableStream<AiStreamChunk>> {
      // Gemini não tem role "system" — injeta como par user→model falso
      const contents = [
        { role: 'user', parts: [{ text: options.systemPrompt }] },
        {
          role: 'model',
          parts: [{ text: 'Entendido! Estou pronto para ajudar.' }],
        },
        ...options.messages.map((msg) => ({
          role: msg.role === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: msg.content }],
        })),
      ]

      // Montar config com tools opcionais
      const config: Record<string, unknown> = {
        // Gemini 2.5 tem thinking habilitado por default.
        // Desabilitar para evitar stream vazio em function calls.
        thinkingConfig: { thinkingBudget: 0 },
      }
      if (options.tools && options.tools.length > 0) {
        config.tools = [
          {
            functionDeclarations: options.tools.map((t) => ({
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            })),
          },
        ]
      }

      const response = ai.models.generateContentStream({
        model: options.model,
        contents,
        config,
      })

      // Transforma o async iterator do Gemini em ReadableStream genérico
      return new ReadableStream<AiStreamChunk>({
        async start(controller) {
          try {
            const result = await response
            for await (const chunk of result) {
              const parts = chunk.candidates?.[0]?.content?.parts
              if (!parts) continue

              for (const part of parts) {
                // Ignorar partes de "pensamento" do modelo
                if ((part as any).thought) continue

                if (part.functionCall) {
                  controller.enqueue({
                    type: 'tool_call',
                    toolCall: {
                      name: part.functionCall.name!,
                      args: (part.functionCall.args as Record<string, unknown>) || {},
                    },
                  })
                } else if (part.text) {
                  controller.enqueue({ type: 'text', text: part.text })
                }
              }
            }
            controller.close()
          } catch (error: any) {
            // Log completo para debug no servidor
            console.error('[Gemini] Stream error:', error)

            // Detectar erro de quota excedida
            const isQuotaError =
              error?.status === 429 ||
              error?.statusCode === 429 ||
              error?.message?.includes('RESOURCE_EXHAUSTED') ||
              error?.message?.includes('quota') ||
              error?.message?.includes('429')

            if (isQuotaError) {
              // Mensagem amigável para o usuário
              controller.enqueue({
                type: 'text',
                text: '⚠️ O assistente Kai está temporariamente indisponível. Tente novamente em alguns minutos.'
              })
            } else {
              // Outro tipo de erro - mensagem genérica
              controller.enqueue({
                type: 'text',
                text: '⚠️ Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.'
              })
            }
            controller.close()
          }
        },
      })
    },
  }
}
