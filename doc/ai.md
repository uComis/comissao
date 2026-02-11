# IA — Assistente de Comissões

Documentação da implementação de Inteligência Artificial no uComis.

## Visão Geral

O uComis possui um assistente de IA integrado ao dashboard chamado **Kai**. Usa o modelo Gemini 2.5 Flash do Google com:
- **Conhecimento do sistema** — sabe como funciona cada tela, conceito, regra de negócio
- **Dados reais do usuário** — comissões, vendas, recebíveis, pastas, regras, preferências
- **Guia interativo** — pode orientar passo a passo sobre qualquer funcionalidade
- **Histórico persistido** — conversas salvas no Supabase, retomáveis entre sessões

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Modelo | `gemini-2.5-flash` (Google) |
| SDK | `@google/genai` v1.35.0 |
| Runtime | Edge (Vercel), timeout 30s |
| Streaming | Server-Sent Events (SSE) |
| Auth | Supabase (valida sessão antes de chamar o modelo) |
| Persistência | Supabase (`ai_conversations` + `ai_messages`) |
| Markdown | `react-markdown` (respostas do assistente) |

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
├── components/
│   ├── ai-assistant/
│   │   ├── index.ts                 # Re-exports
│   │   ├── ai-chat-context.tsx      # Context + Provider (state global do chat)
│   │   ├── ai-chat-button.tsx       # Botão flutuante (renderizado pelo Provider)
│   │   └── ai-chat-window.tsx       # Janela de chat com streaming + markdown
│   │
│   └── layout/
│       ├── sidebar-kai-history.tsx   # Histórico de conversas na sidebar (desktop)
│       └── bottom-nav.tsx           # Navegação inferior com botão Kai (mobile)
│
└── app/api/ai/
    ├── chat/
    │   └── route.ts                 # Orquestrador: auth → persist → dados → prompt → AI → SSE
    └── conversations/
        ├── route.ts                 # GET lista conversas | POST cria conversa vazia
        └── [id]/messages/
            └── route.ts             # GET mensagens de uma conversa
```

### Separação de Responsabilidades

| Camada | Responsabilidade | Sabe sobre |
|--------|------------------|-----------|
| `clients/ai/` | HTTP wrapper genérico | Apenas a API do provedor (Gemini) |
| `clients/ai/kai-knowledge.ts` | Conhecimento estático do sistema | Funcionalidades, conceitos, regras, menus, como fazer |
| `services/ai-context-service.ts` | Agregar dados do domínio | Supabase, DashboardService, recebíveis, pastas, preferências |
| `route.ts` (chat) | Orquestrar o fluxo | Auth, persistência, context service, knowledge, AI client, SSE |
| `route.ts` (conversations) | CRUD de conversas | Supabase, auth |
| `ai-chat-context.tsx` | Estado global do chat | Conversas, mensagens, open/close, load/save |

### Fluxo

```
┌──────────────────────────────────────────────────────────────────┐
│  Pontos de Entrada                                                │
│    BottomNav (mobile) → useAiChat().toggle()                      │
│    Sidebar (desktop)  → useAiChat().loadConversation(id)          │
│    Header Sparkles    → useAiChat().toggle()                      │
│                                                                   │
│  AiChatWindow                                                     │
│    POST /api/ai/chat (com histórico + conversation_id)            │
│         │                                                         │
│         ▼                                                         │
│  API Route (Edge)                                                 │
│    1. Autentica usuário (Supabase)                                │
│    2. Busca profile + organization                                │
│    3. Resolve conversa (cria nova ou usa existente)               │
│    4. Salva mensagem do usuário no banco                          │
│    5. Busca dados reais (6 fontes em paralelo, timeout 8s cada)  │
│    6. Monta system prompt:                                        │
│       [Identidade] + [Knowledge Base] + [Dados Reais]             │
│    7. Chama AI client (Gemini 2.5 Flash, streaming)               │
│    8. Retorna SSE: {conversation_id} → {text}... → [DONE]        │
│    9. Fire-and-forget: salva resposta do assistente no banco      │
│         │                                                         │
│         ▼                                                         │
│  AiChatWindow                                                     │
│    Captura conversation_id do 1º evento SSE                       │
│    Exibe resposta com efeito de digitação (8ms/char)              │
│    Renderiza markdown (react-markdown + prose)                    │
│    Atualiza lista de conversas na sidebar                         │
└──────────────────────────────────────────────────────────────────┘
```

## Persistência de Conversas

### Tabelas Supabase

**`ai_conversations`**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | Gerado automaticamente |
| `user_id` | UUID (FK → auth.users) | Dono da conversa |
| `title` | TEXT | Primeiros 50 chars da primeira mensagem |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Atualizado a cada nova mensagem |

**`ai_messages`**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | Gerado automaticamente |
| `conversation_id` | UUID (FK → ai_conversations) | A qual conversa pertence |
| `role` | TEXT | `'user'` ou `'assistant'` |
| `content` | TEXT | Conteúdo da mensagem |
| `created_at` | TIMESTAMPTZ | Auto |

**RLS:** Usuário só acessa suas próprias conversas e mensagens.

### API Routes

**`GET /api/ai/conversations`** — Lista conversas do usuário
- Query param: `limit` (default 20)
- Retorna: `[{ id, title, updated_at }]` ordenado por `updated_at DESC`

**`POST /api/ai/conversations`** — Cria conversa vazia
- Retorna: `{ id, title: null }`

**`GET /api/ai/conversations/:id/messages`** — Mensagens de uma conversa
- Retorna: `[{ id, role, content, created_at }]` em ordem cronológica

### Fluxo de Persistência

1. Usuário envia mensagem → frontend envia `{ messages, conversation_id }` ao `/api/ai/chat`
2. Se `conversation_id` é null → cria nova `ai_conversations` com título = primeiros 50 chars
3. Salva mensagem do usuário em `ai_messages`
4. Primeiro evento SSE devolve `{ conversation_id }` para o frontend rastrear
5. Após stream completo, salva resposta do assistente em `ai_messages` (fire-and-forget)
6. Atualiza `updated_at` da conversa

**Ao abrir o chat pela primeira vez:**
- Busca última conversa (`GET /api/ai/conversations?limit=1`)
- Carrega suas mensagens e exibe no chat
- Atualiza lista de conversas para a sidebar

## System Prompt — 3 Camadas

O prompt que o Kai recebe é composto por 3 blocos:

### 1. Identidade + Diretrizes
Definido em `route.ts`. Quem o Kai é, o que pode fazer, e como deve se comportar (tom direto, português BR, chamar pelo nome, nunca inventar dados, usar emojis com moderação, formatar com markdown).

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

**Nota sobre Gemini:** Como Gemini não tem role "system" nativo, o `gemini-provider.ts` injeta o system prompt como mensagem de usuário + acknowledgment falso do model. Essa lógica é interna ao provider e transparente para quem consome `AiClient`.

## Onde é Chamado

| Local | Plataforma | Arquivo | Ação |
|-------|-----------|---------|------|
| BottomNav | Mobile | `components/layout/bottom-nav.tsx` | Botão "KAI" (Sparkles) no 5º slot da nav |
| Header Sparkles | Mobile | `components/layout/header.tsx` | Botão Sparkles no topo |
| PageHeader Sparkles | Desktop | `components/layout/page-header.tsx` | Botão Sparkles no topo |
| Sidebar — Histórico | Desktop | `components/layout/sidebar-kai-history.tsx` | Lista de conversas + "Nova conversa" |
| Layout wrapper | Ambos | `app/(dashboard)/layout.tsx` | `<AiChatProvider>` envolve todo o dashboard |

**Hierarquia de providers no layout:**
```
<CurrentUserProvider>
  <AiChatProvider>             ← Estado global do Kai
    <SidebarProvider>
      <AppSidebar>
        <SidebarKaiHistory />  ← Histórico na sidebar
      </AppSidebar>
      <SidebarInset>
        <Header />
        <LayoutPageHeader />
        <main>{children}</main>
        <BottomNav />          ← Botão Kai no mobile
      </SidebarInset>
    </SidebarProvider>
  </AiChatProvider>
</CurrentUserProvider>
```

## Componentes

### AiChatProvider (`ai-chat-context.tsx`)

Context React que gerencia todo o estado do chat. Renderiza o `AiChatWindow` condicionalmente quando `isOpen` é true.

**Estado:**
```typescript
{
  isOpen: boolean              // Chat visível?
  conversationId: string|null  // Conversa atual
  messages: Message[]          // Mensagens em memória
  conversations: ConversationSummary[]  // Lista para sidebar
  isLoadingHistory: boolean    // Carregando mensagens do DB?
  hasLoadedInitial: boolean    // Evita carregamento duplicado
}
```

**Funções expostas:**
```typescript
toggle()                       // Abre/fecha o chat
addMessage(msg)                // Adiciona mensagem local
updateMessage(id, content)     // Atualiza durante streaming
startNewConversation()         // Reseta para chat em branco
loadConversation(id)           // Busca mensagens da API e abre o chat
refreshConversations()         // Atualiza lista de conversas (sidebar)
setConversationId(id)          // Define conversa ativa (usado pelo SSE)
```

**Auto-load na primeira abertura:**
1. Busca última conversa (`limit=1`)
2. Carrega suas mensagens
3. Atualiza lista completa de conversas
4. Popula UI

### AiChatWindow (`ai-chat-window.tsx`)

Janela de chat principal com UI completa.

**Layout:**
- **Mobile:** fullscreen com backdrop semitransparente
- **Desktop:** painel fixo bottom-right (480px largura, min 500px / max 700px altura, arredondado)
- Animação: slide-in-from-bottom (mobile) / slide-in-from-right (desktop)

**Header do chat:**
- Avatar do Kai (Bot icon, fundo primary)
- Indicador "Online" (bolinha verde pulsante)
- Botão "Nova conversa" (SquarePen)
- Botão fechar (X)

**Avatar do usuário:**
- Foto do perfil (`profile.avatar_url`) quando disponível
- Fallback: iniciais coloridas (8 cores hash-based, consistentes por nome)

**Mensagens de boas-vindas:**
- 10 variantes aleatórias, personalizadas com primeiro nome
- Exibidas apenas quando não há mensagens (nova conversa)

**Renderização de mensagens:**
- Usuário: bolha primary, texto simples
- Assistente: bolha muted, **markdown completo** (`react-markdown` + prose-sm)
  - Suporta: negrito, listas, headings, links, code blocks
  - Config prose: margens mínimas, dark mode
- Cursor pulsante durante streaming

**Efeito de digitação:**
- Chunks do SSE recebidos → renderizados char a char (8ms delay)
- Auto-scroll para mensagem mais recente

**Input:**
- Enter envia, Shift+Enter quebra linha
- Botão send desabilitado durante loading/streaming

### SidebarKaiHistory (`sidebar-kai-history.tsx`)

Seção colapsável na sidebar desktop com histórico de conversas.

- **Header:** ícone Sparkles + "Kai" + chevron rotativo
- **Botão "Nova conversa":** borda tracejada, cria conversa e abre chat se fechado
- **Lista de conversas:** ícone MessageSquare + título truncado, clique carrega conversa
- **Auto-refresh:** busca conversas no mount via `useEffect`

### BottomNav — Botão Kai (`bottom-nav.tsx`)

5º item da navegação inferior mobile (substituiu o antigo botão "Menu").

- Ícone: Sparkles (stroke 2.5px quando ativo)
- Label: "KAI" (uppercase, 10px, bold)
- Cor ativa: `#409EFF` (landing-primary)
- Feedback tátil: `active:scale-90`
- Ação: `toggleAiChat()`

### AiChatButton (`ai-chat-button.tsx`)

Botão flutuante (FAB) com ícones alternantes. Renderizado pelo `AiChatProvider`, posicionado bottom-right com offset para mobile nav.

## Landing Page — Kai

A seção `app/site/secoes/kai.tsx` apresenta o assistente na landing page com a identidade **"Kai"**:

- Proposta: "Fricção Zero" — colar texto do WhatsApp e o Kai gerar automaticamente o card de comissão
- Placeholder para vídeo screencast demonstrativo
- Ainda não conectado à implementação real do chat

## Limitações Atuais

| Limitação | Descrição |
|-----------|-----------|
| Sem tool calling | O modelo não executa ações (criar venda, consultar recebível). Apenas conversa. |
| Sem rate limiting | Não há controle de uso por usuário. |
| Sem vínculo com plano | Qualquer usuário logado pode usar, independente do plano. |
| Sem busca em conversas | Não há search dentro do histórico de conversas. |
| Sem exclusão de conversas | UI não permite deletar conversas ou mensagens individuais. |
| Sem renomear conversas | Título é auto-gerado (primeiros 50 chars); não há edição. |
| Save assíncrono silencioso | Se o save da resposta do assistente falhar, o usuário não é notificado. |

## Evolução Planejada

A landing page (seção Kai) já vende a visão futura:

1. **Tool calling** — Executar ações como criar venda, gerar relatório
2. **Input por texto livre** — Colar texto do WhatsApp e o Kai estruturar em venda
3. **Vínculo com plano** — Limitar uso por tier de assinatura
4. **Busca e gestão de conversas** — Buscar, renomear e deletar conversas
5. **Monitoramento de uso** — Tracking de tokens e custos por usuário
