# IA — Assistente de Comissões

Documentação da implementação de Inteligência Artificial no uComis.

## Visão Geral

O uComis possui um assistente de IA integrado ao dashboard chamado **Kai**. Atualmente funciona como um chatbot conversacional contextualizado com dados básicos do usuário, usando o modelo Gemini 2.5 Flash do Google.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Modelo | `gemini-2.5-flash` (Google) |
| SDK | `@google/genai` v1.35.0 |
| Runtime | Edge (Vercel), timeout 30s |
| Streaming | Server-Sent Events (SSE) |
| Auth | Supabase (valida sessão antes de chamar o modelo) |

**Variável de ambiente:** `GEMINI_API_KEY`

## Arquitetura

### Estrutura de Arquivos

```
src/
├── components/ai-assistant/
│   ├── index.ts                  # Re-exports
│   ├── ai-chat-context.tsx       # Context + Provider (controla open/close)
│   ├── ai-chat-button.tsx        # Botão flutuante (não utilizado)
│   └── ai-chat-window.tsx        # Janela de chat com streaming
│
└── app/api/ai/chat/
    └── route.ts                  # API Route (Edge) → Gemini 2.5 Flash
```

### Fluxo

```
┌──────────────────────────────────────────────────────────────┐
│  Header / PageHeader                                         │
│    Botão Sparkles → useAiChat().toggle()                     │
│                                                              │
│  AiChatWindow                                                │
│    POST /api/ai/chat (com histórico de mensagens)            │
│         │                                                    │
│         ▼                                                    │
│  API Route (Edge)                                            │
│    1. Autentica usuário (Supabase)                           │
│    2. Busca profile + organization                           │
│    3. Monta system prompt com contexto do usuário            │
│    4. Chama Gemini 2.5 Flash (streaming)                     │
│    5. Retorna SSE chunks para o frontend                     │
│         │                                                    │
│         ▼                                                    │
│  AiChatWindow                                                │
│    Exibe resposta com efeito de digitação (8ms/caractere)    │
└──────────────────────────────────────────────────────────────┘
```

## Onde é Chamado

| Local | Plataforma | Arquivo | Ação |
|-------|-----------|---------|------|
| Header (mobile) | Mobile | `components/layout/header.tsx` | Botão Sparkles no topo |
| PageHeader (desktop) | Desktop | `components/layout/page-header.tsx` | Botão Sparkles no topo |
| Layout wrapper | Ambos | `app/(dashboard)/layout.tsx` | `<AiChatProvider>` envolve todo o dashboard |

O `AiChatProvider` vive no layout do dashboard, garantindo que o estado open/close persista durante a navegação entre páginas.

## System Prompt

O backend monta um prompt contextualizado com:

- **Nome** do usuário (via `profiles`)
- **Email** (via Supabase Auth)
- **Organização** (via `organizations`)
- **Cargo** (via `profiles.role`)

Diretrizes do prompt:
- Responder sobre vendas, comissões e recebíveis
- Ajudar a interpretar relatórios e métricas
- Sugerir ações para melhorar resultados
- Usar português brasileiro e formatar valores em R$

## Componentes

### AiChatProvider (`ai-chat-context.tsx`)

Context React que controla o estado open/close do chat. Renderiza o `AiChatWindow` condicionalmente.

```typescript
const { toggle } = useAiChat() // abre/fecha o chat
```

### AiChatWindow (`ai-chat-window.tsx`)

Janela de chat com:
- **Mobile:** fullscreen
- **Desktop:** painel fixo bottom-right (480px largura, 50vh altura)
- Mensagem de boas-vindas ao abrir
- Efeito de digitação caractere por caractere
- Indicador de loading e cursor pulsante durante streaming
- Tratamento de erros

### AiChatButton (`ai-chat-button.tsx`)

Botão flutuante (FAB) alternativo. **Atualmente não utilizado** — a integração é feita via botão Sparkles no header/page-header.

## Landing Page — Kai

A seção `app/site/secoes/kai.tsx` apresenta o assistente na landing page com a identidade **"Kai"**:

- Proposta: "Fricção Zero" — colar texto do WhatsApp e o Kai gerar automaticamente o card de comissão
- Placeholder para vídeo screencast demonstrativo
- Ainda não conectado à implementação real do chat

## Limitações Atuais

| Limitação | Descrição |
|-----------|-----------|
| Sem acesso a dados reais | O agente não consulta vendas, comissões ou recebíveis do usuário. É um chatbot genérico contextualizado apenas com nome/email/org. |
| Sem histórico persistido | Conversas vivem só no state React. Fechar o chat perde tudo. |
| Sem tool calling | O modelo não executa ações (criar venda, consultar recebível). Apenas conversa. |
| Sem rate limiting | Não há controle de uso por usuário. |
| Sem vínculo com plano | Qualquer usuário logado pode usar, independente do plano. |

## Evolução Planejada

A landing page (seção Kai) já vende a visão futura:

1. **Acesso a dados reais** — Consultar vendas, comissões, recebíveis do usuário
2. **Tool calling** — Executar ações como criar venda, gerar relatório
3. **Input por texto livre** — Colar texto do WhatsApp e o Kai estruturar em venda
4. **Histórico persistido** — Salvar conversas no banco
5. **Vínculo com plano** — Limitar uso por tier de assinatura
