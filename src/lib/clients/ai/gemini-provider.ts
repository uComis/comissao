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
      const config: Record<string, unknown> = {}
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
        config: Object.keys(config).length > 0 ? config : undefined,
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
          } catch (error) {
            controller.error(error)
          }
        },
      })
    },
  }
}
