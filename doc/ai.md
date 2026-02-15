# IA — Assistente de Comissões

Documentação da implementação de Inteligência Artificial no uComis.

## Visão Geral

O uComis possui um assistente de IA integrado ao dashboard chamado **Kai**. Usa o modelo Gemini 2.5 Flash do Google com:
- **Conhecimento do sistema** — sabe como funciona cada tela, conceito, regra de negócio, preços dos planos
- **Dados reais sob demanda** — consulta comissões, vendas, recebíveis, pastas, clientes e rankings via tools
- **Ações por conversa** — cria vendas, cadastra clientes/pastas, registra recebimentos, navega para páginas
- **Guia interativo** — orienta passo a passo sobre qualquer funcionalidade
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
│   │   ├── types.ts                 # AiClient, AiMessage, AiStreamChunk, AiToolCall
│   │   ├── gemini-provider.ts       # Implementação Gemini (com suporte a tools)
│   │   ├── kai-knowledge.ts         # Knowledge base estática do sistema
│   │   ├── kai-tools.ts             # Declarações de function calling (query + action + nav)
│   │   └── index.ts                 # Factory createAiClient() + re-exports
│   │
│   └── services/
│       ├── ai-context-service.ts    # Base context + query tool handlers
│       ├── ai-name-resolver.ts      # Resolve nomes de clientes/pastas por busca fuzzy + swap detection
│       ├── ai-receivables-search.ts # Busca parcelas de recebíveis com fuzzy matching
│       ├── ai-duplicate-checker.ts  # Verifica duplicatas antes de criar cliente/pasta
│       └── ai-date-resolver.ts      # Resolve expressões de data em linguagem natural
│
├── components/
│   ├── ai-assistant/
│   │   ├── index.ts                 # Re-exports públicos
│   │   ├── ai-chat-context.tsx      # Context + Provider (state global do chat + tool calls)
│   │   ├── ai-chat-window.tsx       # Janela de chat com streaming + markdown + tool cards
│   │   ├── kai-panel.tsx            # Painel fixo (desktop) + overlay fullscreen (mobile)
│   │   ├── kai-content-push.tsx     # Push do conteúdo do dashboard quando painel abre
│   │   ├── kai-panel-offset.tsx     # Offset CSS para alinhamento do painel
│   │   ├── kai-icon.tsx             # Ícone custom do Kai (orb + sparkle animado)
│   │   ├── kai-suggestions.ts       # Sugestões contextuais por rota (chips de ação rápida)
│   │   ├── sale-confirmation-card.tsx    # Card de preview/confirmação de venda
│   │   ├── payment-confirmation-card.tsx # Card de confirmação de recebimento
│   │   ├── kai-dashboard-card.tsx   # Card do Kai na home do dashboard
│   │   ├── kai-dashboard-banner.tsx # Banner de descoberta do Kai
│   │   └── kai-form-card.tsx        # Card do Kai em formulários
│   │
│   └── layout/
│       ├── sidebar-kai-history.tsx   # Histórico de conversas na sidebar (desktop)
│       └── bottom-nav.tsx           # Navegação inferior com botão Kai (mobile)
│
└── app/api/ai/
    ├── chat/
    │   └── route.ts                 # Orquestrador: auth → persist → base context → prompt → AI → multi-turn tools → SSE
    ├── tool-execute/
    │   └── route.ts                 # Executa tool call confirmado (createPersonalSale, registerPayment)
    └── conversations/
        ├── route.ts                 # GET lista conversas | POST cria conversa vazia
        └── [id]/messages/
            └── route.ts             # GET mensagens de uma conversa
```

### Separação de Responsabilidades

| Camada | Responsabilidade | Sabe sobre |
|--------|------------------|-----------:|
| `clients/ai/` | HTTP wrapper genérico | Apenas a API do provedor (Gemini) |
| `clients/ai/kai-knowledge.ts` | Conhecimento estático do sistema | Funcionalidades, conceitos, regras, menus, guias, planos, FAQ |
| `clients/ai/kai-tools.ts` | Declarações de function calling | Schema das tools (query + action + nav) para o Gemini |
| `services/ai-context-service.ts` | Base context + query tool handlers | Supabase, DashboardService, recebíveis, pastas, clientes, vendas |
| `services/ai-name-resolver.ts` | Resolver nomes fuzzy + swap detection | Busca clientes/pastas por regex accent-insensitive, scoring, swap |
| `services/ai-receivables-search.ts` | Buscar parcelas de recebíveis | Filtra por cliente, pasta, status, datas, nº da venda/parcela |
| `services/ai-duplicate-checker.ts` | Verificar duplicatas | Compara nomes antes de criar cliente/pasta |
| `services/ai-date-resolver.ts` | Resolver datas em linguagem natural | "último trimestre", "entre outubro e dezembro", "mês passado" |
| `route.ts` (chat) | Orquestrar o fluxo completo | Auth, persistência, context, knowledge, AI client, multi-turn tools, SSE |
| `route.ts` (tool-execute) | Executar tool call confirmado | Chama createPersonalSale() ou registerPayment() |
| `route.ts` (conversations) | CRUD de conversas | Supabase, auth |
| `ai-chat-context.tsx` | Estado global do chat | Conversas, mensagens, tool call status, painel, load/save |

### Fluxo Principal — Context-as-Tools

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Pontos de Entrada                                                           │
│    BottomNav (mobile) → useAiChat().toggle()                                 │
│    Sidebar (desktop)  → useAiChat().loadConversation(id)                     │
│    Header Sparkles    → useAiChat().toggle()                                 │
│    Dashboard Card     → useAiChat().toggle()                                 │
│                                                                              │
│  AiChatWindow                                                                │
│    POST /api/ai/chat (com histórico + conversation_id)                       │
│         │                                                                    │
│         ▼                                                                    │
│  API Route (Edge)                                                            │
│    1. Autentica usuário (Supabase)                                           │
│    2. Busca profile + organization                                           │
│    3. Resolve conversa (cria nova ou usa existente)                           │
│    4. Salva mensagem do usuário no banco                                     │
│    5. Busca base context LEVE (~200 tokens):                                 │
│       - Nome, email, data de hoje                                            │
│       - Counts: pastas, clientes, vendas                                     │
│    6. Monta system prompt:                                                   │
│       [Identidade + Diretrizes] + [Knowledge Base] + [Base Context]          │
│    7. Chama AI client (Gemini 2.5 Flash, streaming, todas as tools)          │
│    8. Multi-turn loop (máx 3 rounds):                                        │
│       ┌─ Se model chama query tool (get_dashboard, get_client_list, etc):    │
│       │   a. Executa query tool no backend                                   │
│       │   b. Adiciona tool_call + tool_response ao histórico                 │
│       │   c. Chama AI novamente com os dados → model gera resposta           │
│       └─ Repete até model gerar texto ou atingir MAX_QUERY_TURNS             │
│    9. Se model chama action tool (create_sale, create_client, etc):           │
│       a. Processa inline (resolve nomes, calcula comissão, etc)              │
│       b. Envia resultado via SSE (preview card ou mensagem de erro)          │
│   10. SSE [DONE] + fire-and-forget: salva resposta no banco                  │
│         │                                                                    │
│         ▼                                                                    │
│  AiChatWindow                                                                │
│    Captura conversation_id do 1º evento SSE                                  │
│    Exibe resposta com efeito de digitação (3 chars/tick, 2ms delay)           │
│    Renderiza markdown (react-markdown + prose)                               │
│    Se SSE {tool_call: create_sale} → SaleConfirmationCard                    │
│    Se SSE {tool_call: register_payment} → PaymentConfirmationCard            │
│    Se SSE {navigate} → router.push(route)                                    │
│    Atualiza lista de conversas na sidebar                                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Tools — 3 Categorias

O Kai possui 3 categorias de tools, todas declaradas em `kai-tools.ts`:

### 1. Query Tools (consulta sob demanda)

Executadas em loop multi-turn: o model chama → backend executa → resultado volta pro model → model gera resposta.

| Tool | Handler | Dados retornados |
|------|---------|-----------------|
| `get_dashboard` | `fetchDashboardData()` | Comissão do mês, meta, vendas, financeiro, rankings top clientes/pastas |
| `get_supplier_list` | `fetchSupplierList()` | Lista de pastas com regras de comissão |
| `get_client_list` | `fetchClientList()` | Lista de clientes ativos com telefone/email |
| `get_receivables_summary` | `fetchReceivablesTotals()` | Totais de recebíveis: pendentes, vencidos, recebidos |
| `get_recent_sales` | `fetchRecentSales()` | Últimas vendas (filtráveis por cliente/pasta, máx 20) |
| `get_historical_data` | `fetchHistoricalData()` | Vendas/comissões de um período (com `resolveDateRange()`) |

**Máximo 3 rounds** de query tools por mensagem (constante `MAX_QUERY_TURNS`). Isso previne loops infinitos e garante resposta rápida.

### 2. Action Tools (efeitos colaterais)

Executadas uma vez após o stream. Produzem cards de confirmação ou mensagens de resultado.

| Tool | Ação | Card |
|------|------|------|
| `create_sale` | Registra venda via conversa | `SaleConfirmationCard` — preview + botões Confirmar/Cancelar |
| `create_client` | Cadastra cliente | Mensagem de sucesso/erro inline |
| `create_supplier` | Cadastra pasta/fornecedor | Mensagem de sucesso/erro inline |
| `search_receivables` | Busca parcelas para recebimento | `PaymentConfirmationCard` — lista parcelas + confirmar em lote |

### 3. Navigation Tool

| Tool | Ação |
|------|------|
| `navigate_to` | Navega para uma página do app (home, vendas, faturamento, clientes, pastas, planos, conta, configuracoes, ajuda) |

## System Prompt — 3 Camadas

### 1. Identidade + Diretrizes (`route.ts`)
Quem o Kai é, instruções para cada tool, regras de linguagem, formatação. Inclui:
- **Regra de ouro sobre nomes**: "O uComis é pessoal. O ÚNICO vendedor é o dono da conta. Nomes mencionados referem-se SEMPRE a clientes ou pastas, NUNCA a outros vendedores."
- **Linguagem**: Nunca exibir URLs/paths técnicos. Usar nomes amigáveis ("Minhas Vendas", não "/minhasvendas").
- **Valores coloquiais**: Interpreta "3 mil" = 3000, "5k" = 5000, "quinze mil" = 15000.

### 2. Knowledge Base (`kai-knowledge.ts`)
Conhecimento estático sobre o sistema. Injetado como constante TypeScript.

**Conteúdo:**
- O que o uComis faz e NÃO faz
- Conceitos do domínio: pasta, cliente, venda, recebível, regra de comissão
- Mapa completo de páginas com nomes amigáveis (rotas internas marcadas como "uso interno de navigate_to")
- Guias passo a passo: como registrar venda, cliente, pasta, regra, recebimento, trocar de plano
- Regras de comissão em detalhe (fixa e escalonada com exemplos numéricos)
- Condições de pagamento com exemplos
- Status de recebíveis
- **Planos e preços**: Free (R$ 0), Pro (R$ 39,90/mês), Ultra (R$ 99,90/mês), Trial 14 dias
- FAQ completo
- Preferências do usuário
- Segurança e privacidade

### 3. Base Context (`ai-context-service.ts`)
Dados leves (~200 tokens) buscados a cada mensagem:
- Nome e email do usuário
- Data de hoje
- Counts: pastas, clientes, vendas

**Dados detalhados** (dashboard, rankings, recebíveis, etc.) são buscados **sob demanda** via query tools — não são mais injetados no prompt.

## Serviços de Suporte

### Name Resolver (`ai-name-resolver.ts`)

Busca fuzzy accent-insensitive com scoring:

| Score | Critério | Ação |
|-------|----------|------|
| 100 | Match exato (case-insensitive) | Aceita automaticamente |
| 80 | Candidato começa com busca | Aceita automaticamente |
| 70 | Todas as palavras iniciam palavras no candidato | Aceita se gap >= 20 do próximo |
| 50 | Contains simples | Candidato |
| 30 | Ao menos uma palavra match parcial | Candidato |

**Swap detection** (`resolveNames()`):
- Faz 4 queries paralelas: cada nome em ambas as tabelas (clientes + fornecedores)
- Se `clientName` só existe em suppliers E `supplierName` só existe em clients → **swap automático**
- Se parcial (só um lado) → mensagem sugestiva: "Não encontrei o cliente X, mas existe a pasta Y"

**Desambiguação:**
- 0 resultados → erro: "não encontrado" + oferta de criar
- 1 resultado ou top com gap >= 20 → aceita automaticamente
- 2+ resultados próximos → lista candidatos para o usuário escolher

### Date Resolver (`ai-date-resolver.ts`)

Converte expressões em português para ranges `{ from, to }` em YYYY-MM-DD:

| Expressão | Exemplo de resultado |
|-----------|---------------------|
| "hoje", "ontem" | Data única |
| "esse mês", "mês passado" | Primeiro e último dia do mês |
| "essa semana", "semana passada" | Segunda a domingo |
| "dezembro", "janeiro" | Mês inteiro (infere ano: se futuro, usa ano anterior) |
| "janeiro de 2025" | Mês inteiro do ano especificado |
| "último trimestre" | 3 meses anteriores ao mês atual |
| "últimos 3 meses" | N meses anteriores |
| "entre outubro e dezembro" | Range de meses (infere ano, suporta cross-year) |
| "esse ano", "ano passado" | Ano inteiro |

### Receivables Search (`ai-receivables-search.ts`)

Busca parcelas na view `v_receivables` com:
- Fuzzy matching de nomes (via `resolveName()`)
- Swap detection (nome de cliente em pasta ou vice-versa)
- Filtros: status, datas, número da parcela, número da venda
- Enriquece resultados com `sale_number` amigável

### Duplicate Checker (`ai-duplicate-checker.ts`)

Antes de criar cliente/pasta:
- Score >= 70 → avisa que existe similar, pergunta se quer criar mesmo assim
- Score 100 → permite (usuário digitou exatamente o mesmo nome, sabe que existe)
- Score < 70 → nenhum conflito

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

### Persistência de Tool Calls

- Tool call: `[TOOL_CALL:create_sale]{...preview}` ou `[TOOL_CALL:register_payment]{...receivables}`
- Resultado: `[TOOL_RESULT:create_sale]{...}` ou `[TOOL_RESULT:register_payment]{...}`
- Ao recarregar, `parsePersistedMessages()` reconhece prefixos e hidrata `toolCall` na Message

## Componentes

### KaiPanel (`kai-panel.tsx`)

Container responsivo do chat:
- **Desktop:** painel fixo à direita, alinhado abaixo do header (`--kai-panel-top`), com borda e sombra. Dois tamanhos: normal (480px) e wide (680px).
- **Mobile:** overlay fullscreen com backdrop semitransparente + slide-in animado.

### AiChatWindow (`ai-chat-window.tsx`)

Janela de chat completa.

**Header:**
- Menu dropdown de conversas (lista + nova conversa)
- Ícone KaiIcon + nome "Kai"
- Botão nova conversa
- Toggle de tamanho do painel (desktop: Lateral / Larga)
- Botão fechar

**Sugestões contextuais** (`kai-suggestions.ts`):
- Chips de ação rápida exibidos na tela de boas-vindas
- Variam por rota: home, vendas, faturamento, clientes, pastas, etc.
- Exemplos: "Registrar uma venda", "Quanto falta pra meta?", "Comissões atrasadas"

**Avatar do usuário:**
- Foto do perfil quando disponível
- Fallback: iniciais coloridas (8 cores hash-based, consistentes por nome)

**Mensagens de boas-vindas:**
- 10 variantes aleatórias, personalizadas com primeiro nome

**Renderização de mensagens:**
- Usuário: bolha primary, texto simples
- Assistente: bolha muted, markdown completo (`react-markdown` + prose-sm)
- Cursor pulsante durante streaming

**Efeito de digitação:**
- Chunks do SSE → renderizados 3 chars por tick a cada 2ms
- Auto-scroll para mensagem mais recente

**Tool call cards:**
- `SaleConfirmationCard` — preview da venda com botões Confirmar/Cancelar
- `PaymentConfirmationCard` — lista parcelas selecionadas com botões Confirmar/Cancelar

**Navegação:**
- Evento SSE `{navigate}` → `router.push(route)` para navegar em tempo real

### KaiIcon (`kai-icon.tsx`)

Ícone custom do Kai: orb azul degradê com brilho especular + sparkle star animado. Tamanhos: 16, 20, 24, 32px.

### KaiContentPush / KaiPanelOffset

Offset e push do conteúdo do dashboard quando o painel do Kai está aberto no desktop, para evitar sobreposição.

### KaiDashboardCard / KaiDashboardBanner / KaiFormCard

Componentes de discovery do Kai integrados em diferentes telas:
- **Dashboard Card** — card na home incentivando uso do Kai
- **Dashboard Banner** — banner dismissível no topo
- **Form Card** — card lateral em formulários (ex: nova venda) com sugestão de usar o Kai

### SidebarKaiHistory (`sidebar-kai-history.tsx`)

Seção colapsável na sidebar desktop com histórico de conversas:
- Ícone Sparkles + "Kai" + chevron rotativo
- Botão "Nova conversa"
- Lista de conversas com título truncado

### BottomNav — Botão Kai (`bottom-nav.tsx`)

5º item da navegação inferior mobile:
- Ícone: Sparkles (stroke 2.5px quando ativo)
- Label: "KAI" (uppercase, 10px, bold)
- Cor ativa: `#409EFF` (landing-primary)
- Ação: `toggleAiChat()`

## Formato SSE

| Evento | JSON | Descrição |
|--------|------|-----------|
| Conversation ID | `{conversation_id: "uuid"}` | Primeiro evento |
| Texto | `{text: "..."}` | Streaming de texto |
| Tool call (venda) | `{tool_call: {name: "create_sale", preview}, navigate}` | Preview + URL do formulário pré-preenchido |
| Tool call (pagamento) | `{tool_call: {name: "register_payment", receivables}}` | Lista de parcelas para confirmar |
| Navegação | `{navigate: "/rota"}` | Navegar para uma página |
| Erro | `{error: "..."}` | Erro genérico |
| Done | `[DONE]` | Fim do stream |

## Tool: create_sale — Fluxo Detalhado

```
Usuário: "vendi 5 mil pro João na Coca"
→ Gemini retorna functionCall create_sale(client_name="João", supplier_name="Coca", gross_value=5000)
→ Backend: resolveNames() — 4 queries paralelas, swap detection
→ Se ambiguidade: SSE {text} com candidatos para escolher
→ Se erro (não encontrado): SSE {text} + oferta de criar via create_client/create_supplier
→ Se OK: busca regra de comissão → calcula via commissionEngine → SSE {tool_call: preview}
→ Chat renderiza SaleConfirmationCard + navega para formulário pré-preenchido
→ Usuário clica "Confirmar" → POST /api/ai/tool-execute → createPersonalSale()
→ Card atualiza para "Venda criada!" + redireciona para detalhe da venda
```

**Cálculo de comissão no preview:**
1. Se usuário informou `commission_rate` e/ou `tax_rate` → usa valores informados
2. Se pasta tem `commission_rule_id` → busca regra → calcula via `commissionEngine.calculate()`
3. Fallback: usa `default_commission_rate` e `default_tax_rate` da pasta

**Condição de pagamento:**
- Se informada: calcula `first_installment_date` a partir do primeiro prazo + data da venda
- Formato: "30/60/90" para 3 parcelas

## Tool: search_receivables — Fluxo Detalhado

```
Usuário: "recebi da Coca"
→ Gemini retorna functionCall search_receivables(client_name="Coca")
→ Backend: resolveName() com swap detection (verifica se "Coca" é cliente ou pasta)
→ Query v_receivables com filtros (status default: pending + overdue)
→ Se 0 resultados: SSE {text} sugerindo alternativas
→ Se resultados: SSE {tool_call: register_payment, receivables}
→ Chat renderiza PaymentConfirmationCard com lista de parcelas
→ Usuário clica "Confirmar" → POST /api/ai/tool-execute → registra pagamentos
```

## Tool: create_client / create_supplier

Executados inline (sem card de confirmação):
1. `checkDuplicate()` verifica se já existe nome similar
2. Se similar (score 70-99): SSE {text} perguntando se quer criar mesmo assim
3. Se OK: `supabase.from('personal_clients').insert(...)` direto
4. SSE {text} com sucesso ou erro

## Tool: navigate_to

Mapa de páginas:

| Valor | Rota | Label |
|-------|------|-------|
| home | /home | Home |
| vendas | /minhasvendas | Minhas Vendas |
| nova_venda | /minhasvendas/nova | Nova Venda |
| faturamento | /faturamento | Faturamento |
| clientes | /clientes | Meus Clientes |
| pastas | /fornecedores | Minhas Pastas |
| planos | /planos | Planos |
| conta | /minhaconta | Minha Conta |
| configuracoes | /configuracoes | Configurações |
| ajuda | /ajuda | Ajuda |

Navegação executada no frontend via `router.push()` ao receber evento SSE `{navigate}`.

## Onde é Chamado

| Local | Plataforma | Arquivo | Ação |
|-------|-----------|---------|------|
| BottomNav | Mobile | `components/layout/bottom-nav.tsx` | Botão "KAI" (Sparkles) no 5º slot da nav |
| Header Sparkles | Mobile | `components/layout/header.tsx` | Botão Sparkles no topo |
| PageHeader Sparkles | Desktop | `components/layout/page-header.tsx` | Botão Sparkles no topo |
| Sidebar — Histórico | Desktop | `components/layout/sidebar-kai-history.tsx` | Lista de conversas + "Nova conversa" |
| Dashboard Card | Ambos | `components/ai-assistant/kai-dashboard-card.tsx` | Card de discovery na home |
| Dashboard Banner | Ambos | `components/ai-assistant/kai-dashboard-banner.tsx` | Banner dismissível |
| Form Card | Desktop | `components/ai-assistant/kai-form-card.tsx` | Card lateral em formulários |
| Layout wrapper | Ambos | `app/(dashboard)/layout.tsx` | `<AiChatProvider>` + `<KaiPanel>` |

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
        <KaiPanelOffset>       ← Offset do conteúdo
          <main>{children}</main>
        </KaiPanelOffset>
        <BottomNav />          ← Botão Kai no mobile
      </SidebarInset>
      <KaiPanel />             ← Painel fixo (desktop) / overlay (mobile)
    </SidebarProvider>
  </AiChatProvider>
</CurrentUserProvider>
```

## AI Client — Trocar Provider

O client AI segue o padrão factory. Para trocar de provider:

1. Criar novo arquivo (ex: `src/lib/clients/ai/openai-provider.ts`)
2. Implementar a interface `AiClient` (método `chat()` retornando `ReadableStream<AiStreamChunk>`)
3. Adicionar `case 'openai'` no switch de `createAiClient()` em `index.ts`
4. Mudar a config no `route.ts`:

```typescript
const client = createAiClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  defaultModel: 'gpt-4o',
})
```

**Nota sobre Gemini:** Como Gemini não tem role "system" nativo, o `gemini-provider.ts` injeta o system prompt como mensagem de usuário + acknowledgment falso do model. Essa lógica é interna ao provider.

## Tratamento de Erros

| Cenário | Resposta |
|---------|----------|
| Cliente não encontrado | Kai responde como texto, oferece criar |
| Múltiplos clientes ambíguos | Kai lista candidatos para escolher |
| Cliente/pasta invertidos | Swap detection automático ou sugestão |
| Pasta não encontrada | Idem cliente |
| Pasta sem regra de comissão | Preview mostra comissão 0% |
| Nome similar existente (criar) | Kai pergunta se quer criar mesmo assim |
| Limite de vendas atingido | Erro no confirm |
| Pasta bloqueada | Erro no confirm |
| Quota Gemini excedida (429) | Mensagem amigável: "Estou recebendo muitas perguntas agora" |
| Erro de rede no confirm | Card mostra erro, user pode tentar de novo |
| Período não reconhecido | Kai pede para reformular a pergunta |

## Limitações Atuais

| Limitação | Descrição |
|-----------|-----------|
| Sem rate limiting | Não há controle de uso por usuário |
| Sem vínculo com plano | Qualquer usuário logado pode usar, independente do plano |
| Sem busca em conversas | Não há search dentro do histórico de conversas |
| Sem exclusão de conversas | UI não permite deletar conversas ou mensagens individuais |
| Sem renomear conversas | Título é auto-gerado (primeiros 50 chars); não há edição |
| Save assíncrono silencioso | Se o save da resposta do assistente falhar, o usuário não é notificado |

## Landing Page — Kai

A seção `app/site/secoes/kai.tsx` apresenta o assistente na landing page:
- Proposta: "Fricção Zero" — colar texto do WhatsApp e o Kai gerar automaticamente o card de comissão
- Placeholder para vídeo screencast demonstrativo
- Ainda não conectado à implementação real do chat

## Evolução Planejada

1. **Input por texto livre** — Colar texto do WhatsApp e o Kai estruturar em venda
2. **Vínculo com plano** — Limitar uso por tier de assinatura
3. **Busca e gestão de conversas** — Buscar, renomear e deletar conversas
4. **Monitoramento de uso** — Tracking de tokens e custos por usuário
5. **OCR de pedido** — Foto do pedido → Kai extrai dados da venda
