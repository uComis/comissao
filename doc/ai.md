# IA — Assistente de Comissões

Documentação da implementação de Inteligência Artificial no uComis.

## Visão Geral

O uComis possui um assistente de IA integrado ao dashboard chamado **Kai**. Usa o modelo Gemini 2.5 Flash do Google com:
- **Conhecimento do sistema** — sabe como funciona cada tela, conceito, regra de negócio
- **Dados reais do usuário** — comissões, vendas, recebíveis, pastas, regras, preferências
- **Guia interativo** — pode orientar passo a passo sobre qualquer funcionalidade

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
├── lib/
│   ├── clients/ai/                  # Client AI genérico (sem domínio)
│   │   ├── types.ts                 # AiClient, AiMessage, AiStreamChunk
│   │   ├── gemini-provider.ts       # Implementação Gemini
│   │   ├── kai-knowledge.ts         # Knowledge base estática do sistema
│   │   └── index.ts                 # Factory createAiClient() + re-exports
│   │
│   └── services/
│       └── ai-context-service.ts    # Agrega dados reais para o prompt
│
├── components/ai-assistant/
│   ├── index.ts                     # Re-exports
│   ├── ai-chat-context.tsx          # Context + Provider (controla open/close)
│   ├── ai-chat-button.tsx           # Botão flutuante (não utilizado)
│   └── ai-chat-window.tsx           # Janela de chat com streaming
│
└── app/api/ai/chat/
    └── route.ts                     # Orquestrador: auth → dados → prompt → AI → SSE
```

### Separação de Responsabilidades

| Camada | Responsabilidade | Sabe sobre |
|--------|------------------|-----------|
| `clients/ai/` | HTTP wrapper genérico | Apenas a API do provedor (Gemini) |
| `clients/ai/kai-knowledge.ts` | Conhecimento estático do sistema | Funcionalidades, conceitos, regras, menus, como fazer |
| `services/ai-context-service.ts` | Agregar dados do domínio | Supabase, DashboardService, recebíveis, pastas, preferências |
| `route.ts` | Orquestrar o fluxo | Auth, context service, knowledge, AI client, SSE |

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
│    3. Busca dados reais (6 fontes em paralelo)               │
│    4. Monta system prompt:                                   │
│       [Identidade] + [Knowledge Base] + [Dados Reais]        │
│    5. Chama AI client (Gemini 2.5 Flash, streaming)          │
│    6. Retorna SSE chunks para o frontend                     │
│         │                                                    │
│         ▼                                                    │
│  AiChatWindow                                                │
│    Exibe resposta com efeito de digitação (8ms/caractere)    │
└──────────────────────────────────────────────────────────────┘
```

## System Prompt — 3 Camadas

O prompt que o Kai recebe é composto por 3 blocos:

### 1. Identidade + Diretrizes
Definido em `route.ts`. Quem o Kai é, o que pode fazer, e como deve se comportar (tom direto, português BR, chamar pelo nome, nunca inventar dados).

### 2. Knowledge Base (`kai-knowledge.ts`)
Conhecimento estático sobre o sistema. Injetado como constante TypeScript (não lê arquivo em runtime — Edge não suporta `fs`).

**Conteúdo:**
- O que o uComis faz e NÃO faz (não é CRM, não emite NF, etc.)
- Conceitos do domínio: pasta, cliente, venda, recebível, regra de comissão
- Todos os menus com caminhos e descrições
- Guias passo a passo: como registrar venda, cliente, pasta, regra, recebimento
- Regras de comissão em detalhe (fixa e escalonada com exemplos numéricos)
- Status de recebíveis e o que cada um significa
- Condições de pagamento com exemplos
- Preferências do usuário
- Limites por plano

**Para editar:** altere `src/lib/clients/ai/kai-knowledge.ts` — é uma string template exportada.

### 3. Dados Reais (`ai-context-service.ts`)
Dados dinâmicos buscados em tempo real a cada mensagem do usuário.

## Dados Reais no Prompt

O `ai-context-service.ts` busca dados de **6 fontes** em paralelo:

| Fonte | Dados | Uso |
|-------|-------|-----|
| `DashboardService.getHomeAnalytics()` | Comissão do mês, vendas, financeiro, rankings top 5 | Métricas mensais |
| Query `v_receivables` (totais) | Pendentes, vencidos, recebidos (totais gerais) | Visão geral financeira |
| Query `personal_suppliers` + `commission_rules` | Todas as pastas com regra padrão | Saber quais pastas o usuário tem e qual comissão |
| Query `personal_clients` (count) | Total de clientes ativos | Contexto do cadastro |
| Query `user_preferences` | Meta de comissão, modo (pessoal/org) | Preferências e meta |
| Query `v_receivables` (próximos 14 dias) | Até 20 parcelas pendentes/atrasadas mais próximas | Alertas de vencimento |

**Resiliência:**
- Cada fonte tem `.catch(() => null)` — se uma falhar, as outras ainda são usadas
- Timeout de 8s para busca de dados — garante que o AI responde mesmo com DB lento
- Se nenhum dado carregar, o AI informa que não tem dados disponíveis

**Seções geradas no prompt:**
1. Usuário (nome, email, org, cargo)
2. Preferências (meta, modo)
3. Comissão do Mês (total, meta, progresso)
4. Vendas do Mês (quantidade, valor bruto, tendência)
5. Financeiro do Mês (recebido, pendente, vencido)
6. Top Clientes (ranking mensal)
7. Top Pastas/Fornecedores (ranking mensal)
8. Recebíveis gerais (totais e contagens)
9. Pastas do Usuário (lista completa com regra de cada uma)
10. Clientes (total cadastrados)
11. Próximos Recebíveis (parcelas dos próximos 14 dias com detalhes)

**Resolução do nome do usuário:**
O serviço tenta múltiplas fontes: `profile.full_name` → `user_metadata.full_name` → `user_metadata.name` → fallback "Usuário". Isso resolve o caso de login via Google onde o nome pode estar apenas no metadata.

## AI Client — Trocar Provider

O client AI segue o mesmo padrão factory do Pipedrive. Para trocar de provider:

1. Criar novo arquivo (ex: `src/lib/clients/ai/openai-provider.ts`)
2. Implementar a interface `AiClient` (método `chat()` retornando `ReadableStream<AiStreamChunk>`)
3. Adicionar `case 'openai'` no switch de `createAiClient()` em `index.ts`
4. Mudar a config no `route.ts`:

```typescript
const client = createAiClient({
  provider: 'openai',  // ← troca aqui
  apiKey: process.env.OPENAI_API_KEY!,
  defaultModel: 'gpt-4o',
})
```

## Onde é Chamado

| Local | Plataforma | Arquivo | Ação |
|-------|-----------|---------|------|
| Header (mobile) | Mobile | `components/layout/header.tsx` | Botão Sparkles no topo |
| PageHeader (desktop) | Desktop | `components/layout/page-header.tsx` | Botão Sparkles no topo |
| Layout wrapper | Ambos | `app/(dashboard)/layout.tsx` | `<AiChatProvider>` envolve todo o dashboard |

O `AiChatProvider` vive no layout do dashboard, garantindo que o estado open/close persista durante a navegação entre páginas.

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
| Sem histórico persistido | Conversas vivem só no state React. Fechar o chat perde tudo. |
| Sem tool calling | O modelo não executa ações (criar venda, consultar recebível). Apenas conversa. |
| Sem rate limiting | Não há controle de uso por usuário. |
| Sem vínculo com plano | Qualquer usuário logado pode usar, independente do plano. |

## Evolução Planejada

A landing page (seção Kai) já vende a visão futura:

1. **Tool calling** — Executar ações como criar venda, gerar relatório
2. **Input por texto livre** — Colar texto do WhatsApp e o Kai estruturar em venda
3. **Histórico persistido** — Salvar conversas no banco
4. **Vínculo com plano** — Limitar uso por tier de assinatura
