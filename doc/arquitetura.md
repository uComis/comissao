# Arquitetura

Documentação técnica da estrutura do projeto, padrões e decisões de arquitetura.

## Testes E2E

O projeto utiliza Playwright para testes end-to-end com arquitetura híbrida: **Routines + Page Objects**.

**📖 Documentação completa:** Ver [`e2e/arquitetura-testes.md`](../e2e/arquitetura-testes.md)

### Resumo

| Camada | Pasta | Responsabilidade |
|--------|-------|------------------|
| Routines | `e2e/routines/` | Funções atômicas reutilizáveis |
| Pages | `e2e/pages/` | Page Objects que orquestram routines |
| Specs | `e2e/specs/` | Arquivos de teste |

### Princípios

1. **Uma única fonte da verdade** - cada ação tem UMA rotina, nunca duplicar
2. **Teste fluxo real, completo** - nada de atalhos, testar o que usuário faria
3. **Routines atômicas, Pages orquestram** - separação clara de responsabilidades

### Scripts

```bash
npm run e2e          # Roda todos os testes
npm run e2e:headed   # Roda com browser visível
npm run e2e:ui       # Abre UI do Playwright
```

---

## Stack Técnica

### Core

| Camada    | Tecnologia                          |
| --------- | ----------------------------------- |
| Framework | Next.js 15 + React 19 + TypeScript  |
| Banco     | Supabase (PostgreSQL)               |
| Auth      | Supabase Auth (Google + Magic Link) |

### Frontend

| Camada        | Tecnologia               |
| ------------- | ------------------------ |
| UI            | Tailwind CSS + shadcn/ui |
| Validação     | Zod                      |
| Estado global | React Context            |
| Gráficos      | Recharts                 |

### Backend

| Camada   | Tecnologia                                                                       |
| -------- | -------------------------------------------------------------------------------- |
| Cálculos | decimal.js _(precisão exata em centavos — JS nativo usa float e perde precisão)_ |
| API      | Next.js API Routes + Server Actions                                              |

### Integrações (por fase)

| Fase    | Tecnologia                        |
| ------- | --------------------------------- |
| MVP     | Pipedrive API (leitura de vendas) |
| Fase 2+ | Resend (envio de emails)          |
| Fase 2+ | Stripe ou Asaas (pagamentos)      |

## Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/                      # Route Group: páginas públicas
│   │   └── login/
│   │       └── page.tsx             # /login
│   │
│   ├── (dashboard)/                 # Route Group: páginas protegidas
│   │   ├── layout.tsx               # Layout com sidebar
│   │   ├── page.tsx                 # / (home do dashboard)
│   │   ├── vendedores/
│   │   │   ├── page.tsx             # /vendedores
│   │   │   └── [id]/
│   │   │       └── page.tsx         # /vendedores/:id
│   │   ├── regras/
│   │   │   ├── page.tsx             # /regras
│   │   │   └── nova/
│   │   │       └── page.tsx         # /regras/nova
│   │   ├── vendas/
│   │   │   └── page.tsx             # /vendas
│   │   ├── relatorios/
│   │   │   └── page.tsx             # /relatorios
│   │   └── configuracoes/
│   │       └── page.tsx             # /configuracoes
│   │
│   ├── actions/                     # Server Actions (mutações)
│   │   ├── user.ts                  # getCurrentUser() - FONTE DA VERDADE
│   │   ├── profiles.ts              # updateProfile()
│   │   ├── billing.ts               # assinaturas, limites
│   │   ├── sellers.ts
│   │   ├── rules.ts
│   │   ├── sales.ts
│   │   └── commissions.ts
│   │
│   └── api/                         # API Routes (endpoints HTTP)
│       ├── pipedrive/
│       │   └── sync/route.ts        # POST /api/pipedrive/sync
│       ├── reports/
│       │   └── pdf/route.ts         # GET /api/reports/pdf
│       └── webhooks/
│           └── pipedrive/route.ts   # POST /api/webhooks/pipedrive
│
├── components/
│   ├── ui/                          # shadcn/ui
│   ├── layout/                      # Sidebar, Header, PageHeader (context-based)
│   ├── sellers/                     # Componentes de vendedores
│   ├── rules/                       # Componentes de regras
│   └── reports/                     # Componentes de relatórios
│
├── contexts/
│   ├── auth-context.tsx             # Login/logout (Supabase Auth)
│   └── organization-context.tsx     # Organização atual (modo empresa)
│
├── hooks/
│   └── use-notifications.ts         # Wrapper do toast
│
├── lib/
│   ├── supabase.ts                  # Cliente Supabase (browser)
│   ├── supabase-server.ts           # Cliente Supabase (server)
│   │
│   ├── clients/                     # APIs externas (REUTILIZÁVEIS)
│   │   ├── pipedrive/
│   │   │   ├── client.ts            # getDeals(), getUsers(), etc.
│   │   │   ├── auth.ts              # OAuth: getAuthUrl(), exchangeCode(), refreshToken()
│   │   │   ├── types.ts             # PipedriveDeal, PipedriveUser, etc.
│   │   │   └── index.ts             # Re-export
│   │   ├── hubspot/
│   │   │   └── ...                  # Mesma estrutura
│   │   └── openai/
│   │       └── ...                  # Futuro: IA
│   │
│   ├── repositories/                # Data Access Layer (DAL)
│   │   ├── seller-repository.ts
│   │   ├── rule-repository.ts
│   │   ├── sale-repository.ts
│   │   ├── commission-repository.ts
│   │   └── integration-repository.ts
│   │
│   ├── services/                    # Regras de negócio (ESPECÍFICAS DO PROJETO)
│   │   ├── commission-service.ts    # Cálculo de comissões
│   │   ├── sync-service.ts          # Orquestra: client + repository
│   │   └── report-service.ts        # Geração de relatórios
│   │
│   ├── route-config.ts              # Mapa rota → título/descrição (fallback do PageHeader)
│   ├── commission-engine.ts         # Cálculos puros (decimal.js)
│   └── pdf-generator.ts             # Geração de PDF
│
└── types/                           # Models/Interfaces
    ├── index.ts                     # Re-export de todos
    ├── seller.ts
    ├── rule.ts
    ├── sale.ts
    └── commission.ts
```

## User Controller (Fonte Única da Verdade)

O sistema centraliza TODOS os dados do usuário em uma única função: `getCurrentUser()`.

### Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│  app/actions/user.ts                                        │
│                                                             │
│  getCurrentUser()  ← FONTE ÚNICA DA VERDADE                 │
│    │                                                        │
│    ├── auth.getUser()         → id, email                   │
│    ├── profiles               → nome, documento, avatar     │
│    ├── user_preferences       → modo (personal/org)         │
│    ├── user_subscriptions     → plano, trial, pagamento     │
│    └── usage_stats            → vendas, fornecedores        │
│                                                             │
│  Retorna: CurrentUser (objeto único com tudo)               │
└─────────────────────────────────────────────────────────────┘
```

### Operações de Usuário

| Operação      | Arquivo                        | Descrição                          |
| ------------- | ------------------------------ | ---------------------------------- |
| **GET**       | `app/actions/user.ts`          | `getCurrentUser()` - retorna tudo  |
| **Login**     | `contexts/auth-context.tsx`    | OAuth, email/senha, magic link     |
| **Cadastro**  | `contexts/auth-context.tsx`    | signUp + trigger cria subscription |
| **Update**    | `app/actions/profiles.ts`      | `updateProfile()` - atualiza dados |
| **Logout**    | `contexts/auth-context.tsx`    | `signOut()`                        |

### Regras

1. **GET centralizado**: Toda leitura de dados do usuário deve passar por `getCurrentUser()`
2. **Uma chamada**: Não fazer múltiplas queries separadas para montar dados do usuário
3. **Context distribui**: O `UserProvider` (ou `BillingBanners`) chama uma vez e distribui via props/context

### Estrutura do CurrentUser

```typescript
interface CurrentUser {
  // Auth básico
  id: string
  email: string
  createdAt: string
  
  // Dados
  profile: UserProfile | null      // nome, documento, avatar
  preferences: UserPreferences     // modo personal/organization
  billing: UserBilling | null      // plano, trial, limites
  usage: UserUsage | null          // contadores de uso
}
```

### Uso nos Componentes

```typescript
// ❌ ERRADO - Múltiplas chamadas separadas
const user = useAuth()
const profile = await getProfile()
const billing = await getBillingUsage()
const prefs = await getPreferences()

// ✅ CORRETO - Uma chamada centralizada
const currentUser = await getCurrentUser()
// currentUser.profile, currentUser.billing, currentUser.preferences
```

---

## Billing System (Sistema de Planos e Assinaturas)

O sistema de billing gerencia planos, assinaturas, trials e limites de uso dos usuários.

**📖 Documentação completa:** Ver [`doc/billing.md`](./billing.md)

### Resumo Arquitetural

- **Fonte única da verdade:** `getEffectiveSubscription()` em `app/actions/billing/plans.ts`
- **Cache inteligente:** 1h para pendentes, 8h para pagos
- **Webhook Asaas:** Ativa planos automaticamente após pagamento
- **Proteções:** Idempotência, rollback automático, verificação de segurança

### Estrutura

```
app/actions/billing/
├── plans.ts              # getEffectiveSubscription() ⭐ (FONTE ÚNICA DA VERDADE)
├── subscriptions.ts      # createSubscription, activatePlan, verify
├── utils.ts              # Constantes e helpers
└── types.ts              # Tipos compartilhados

app/api/webhooks/asaas/
└── route.ts              # Webhook handler (idempotência)
```

### Integração com User Controller

O `getCurrentUser()` consome `getEffectiveSubscription()` para popular `CurrentUser.billing`:

```typescript
// app/actions/user.ts
import { getEffectiveSubscription } from './billing'

export async function getCurrentUser() {
  // ...
  const billing = await getEffectiveSubscription(userId)
  // Retorna CurrentUser com billing populado
}
```

### Fluxo Principal

1. **Criação de assinatura:** `createSubscription()` → Asaas → Banco (sem `current_period_end`)
2. **Pagamento confirmado:** Webhook → `activatePlan()` → Seta `current_period_end`
3. **Verificação de plano:** `getEffectiveSubscription()` → Cache inteligente → Retorna plano efetivo

### Regras de Ouro

1. **SEMPRE** use `getEffectiveSubscription()` como fonte da verdade
2. **NUNCA** consulte `user_subscriptions` diretamente sem passar por ela
3. **NUNCA** atualize `current_period_end` manualmente (só webhook/verificação)
4. **SEMPRE** use cache inteligente (já embutido em `getEffectiveSubscription`)

---

## Camadas

| Camada             | Pasta                             | Responsabilidade                               | Reutilizável? |
| ------------------ | --------------------------------- | ---------------------------------------------- | ------------- |
| **Páginas**        | `app/(auth)/`, `app/(dashboard)/` | UI, renderização                               | Não           |
| **Server Actions** | `app/actions/`                    | Entry point, validação Zod, orquestra services | Não           |
| **API Routes**     | `app/api/`                        | Webhooks externos, OAuth callbacks             | Não           |
| **Componentes**    | `components/`                     | UI reutilizável                                | Não           |
| **Services**       | `lib/services/`                   | Regras de negócio, orquestra clients + repos   | Não           |
| **Repositories**   | `lib/repositories/`               | Acesso ao banco (DAL)                          | Não           |
| **Clients**        | `lib/clients/`                    | Wrappers HTTP de APIs externas                 | **Sim**       |
| **Engine**         | `lib/commission-engine.ts`        | Cálculos puros (decimal.js)                    | Sim           |
| **Types**          | `types/`                          | Models, interfaces, inputs                     | Não           |

### Clients vs Services

**Client** = Wrapper HTTP puro de API externa. Não conhece banco, não conhece domínio. Pode ser copiado para outro projeto.

**Service** = Orquestra clients + repositories para resolver problemas do negócio. Conhece o domínio. Específico deste projeto.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  lib/clients/pipedrive/              ← REUTILIZÁVEL                         │
│  ├── client.ts                       Só faz HTTP para API do Pipedrive      │
│  │   └── getDeals(token) → PipedriveDeal[]                                  │
│  │   └── refreshToken(refreshToken) → TokenResponse                         │
│  ├── types.ts                        Tipos da API (PipedriveDeal, etc.)     │
│  └── auth.ts                         OAuth helpers                          │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              │ usado por
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  lib/services/sync-service.ts        ← NÃO REUTILIZÁVEL (domínio)           │
│  │                                                                          │
│  │  syncDeals(orgId):                                                       │
│  │    1. integrationRepository.findByOrg(orgId)    ← banco                  │
│  │    2. pipedriveClient.refreshToken() se expirou ← client                 │
│  │    3. pipedriveClient.getDeals(token)           ← client                 │
│  │    4. transformToSale(deal)                     ← domínio                │
│  │    5. saleRepository.upsertMany(sales)          ← banco                  │
│  │                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Regra:** Se amanhã você criar outro projeto que usa Pipedrive, copia `lib/clients/pipedrive/`. O service não, porque usa `Sale`, `saleRepository`, etc.

## Cache e Performance

Para garantir dashboards instantâneos mesmo com milhões de registros, o sistema utiliza uma camada de cache persistente no banco de dados.

### 1. Camada de Cache (app_cache)

Tabela genérica `Key/Value` enriquecida com `user_id` e `TTL` (Time To Live).

- **Tabela:** `public.app_cache`
- **Colunas:** `user_id`, `cache_key`, `data` (JSONB), `expires_at` (nullable).
- **Segurança:** Row Level Security (RLS) garante que cada usuário só acesse seu próprio cache.

### 2. Dashboard Service (Single Request Pattern)

Em vez de múltiplas chamadas individuais, o Dashboard é carregado via um único objeto JSON consolidado.

- **Fluxo:** `Componente` → `Action` → `DashboardService` → `CacheService`.
- **Lógica Cache-First:**
  1. Tenta ler do `app_cache`.
  2. Se expirar ou não existir (Cache Miss), executa as queries pesadas (SUM, COUNT, Rankings).
  3. Salva o resultado no cache (JSONB) e entrega ao front.

### 3. Invalidação Automática (Triggers)

O cache é invalidado em tempo real via gatilhos no PostgreSQL.

- **Trigger:** `dashboard_cache_invalidation_trigger` nas tabelas `personal_sales` e `user_preferences`.
- **Ação:** Qualquer `INSERT`, `UPDATE` ou `DELETE` apaga o cache do usuário correspondente.
- **Resultado:** O dado só é recalculado no primeiro acesso após uma alteração, mantendo as leituras subsequentes instantâneas.

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  Componente                                                 │
│      │                                                      │
│      │ importa e chama direto (não é HTTP explícito)        │
│      ▼                                                      │
├─────────────────────────────────────────────────────────────┤
│                        BACKEND                              │
│  Server Action (app/actions/)                               │
│      │ valida input com Zod                                 │
│      ▼                                                      │
│  Service (lib/services/)                                    │
│      │ aplica regras de negócio                             │
│      ▼                                                      │
│  Repository (lib/repositories/)                             │
│      │ monta query                                          │
│      ▼                                                      │
│  Supabase Client (lib/supabase-server.ts)                   │
│      │                                                      │
│      ▼                                                      │
│  PostgreSQL                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Regras de Comunicação

| De              | Para                    | Como                              |
| --------------- | ----------------------- | --------------------------------- |
| Frontend        | Backend próprio         | Server Action (RPC)               |
| Backend         | Banco de dados          | Repository → Supabase             |
| Backend         | API externa (Pipedrive) | Client (`lib/clients/pipedrive/`) |
| Backend         | API externa (HubSpot)   | Client (`lib/clients/hubspot/`)   |
| Backend         | API externa (OpenAI)    | Client (`lib/clients/openai/`)    |
| Sistema externo | Backend próprio         | API Route (HTTP)                  |

**Quem chama o Client?**

| Chamador          | Quando                                             |
| ----------------- | -------------------------------------------------- |
| **Service**       | Operações complexas (sync de deals, refresh token) |
| **API Route**     | OAuth callback (`/api/pipedrive/callback`)         |
| **Server Action** | Operações simples que não precisam de service      |

## Padrões

### Repository

Cada repository expõe métodos sob demanda. Não criar método que não será usado.

```typescript
// lib/repositories/seller-repository.ts
export const sellerRepository = {
  // Queries - criar conforme necessidade
  findById(id: string): Promise<Seller | null>,
  findByOrganization(orgId: string): Promise<Seller[]>,
  findWithCommissions(orgId: string, period: string): Promise<SellerWithCommissions[]>,

  // CRUD
  create(data: CreateSellerInput): Promise<Seller>,
  update(id: string, data: UpdateSellerInput): Promise<Seller>,
  delete(id: string): Promise<void>,
}
```

**Regras:**

- Query simples → método específico (`findById`, `findByOrganization`)
- Query com JOIN → método específico (`findWithCommissions`)
- Não criar métodos especulativos
- Não repetir query em múltiplos lugares

### Services (Regras de Negócio)

Services orquestram repositories e aplicam lógica complexa.

```typescript
// lib/services/commission-service.ts
import { Decimal } from 'decimal.js'
import { saleRepository } from '@/lib/repositories/sale-repository'
import { ruleRepository } from '@/lib/repositories/rule-repository'
import { commissionRepository } from '@/lib/repositories/commission-repository'

export const commissionService = {
  async calculateForPeriod(orgId: string, period: string) {
    // 1. Busca dados de múltiplos repositories
    const sales = await saleRepository.findByPeriod(orgId, period)
    const rules = await ruleRepository.findByOrganization(orgId)

    // 2. Aplica regras de negócio
    const commissions = sales.map((sale) => {
      const rule = rules.find((r) => r.id === sale.rule_id)
      const amount = new Decimal(sale.net_value)
        .times(rule.percentage)
        .dividedBy(100)
        .toDecimalPlaces(2)

      return {
        sale_id: sale.id,
        seller_id: sale.seller_id,
        amount: amount.toNumber(),
      }
    })

    // 3. Persiste resultado
    await commissionRepository.createMany(commissions)

    return commissions
  },
}
```

### Types (Models)

Types definem a estrutura dos dados em todas as camadas.

```typescript
// types/seller.ts
export type Seller = {
  id: string
  organization_id: string
  name: string
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Inputs para criação/atualização
export type CreateSellerInput = Omit<Seller, 'id' | 'created_at' | 'updated_at'>
export type UpdateSellerInput = Partial<CreateSellerInput>

// Com relações (para queries com JOIN)
export type SellerWithCommissions = Seller & {
  commissions: Commission[]
}
```

```typescript
// types/index.ts - Re-export centralizado
export * from './seller'
export * from './rule'
export * from './sale'
export * from './commission'
```

### Server Actions vs API Routes

| Usar               | Quando                                                                    |
| ------------------ | ------------------------------------------------------------------------- |
| **Server Actions** | CRUD interno, formulários, mutações do app                                |
| **API Routes**     | Webhooks externos, download de arquivos, integrações que terceiros chamam |

---

## Guia de Desenvolvimento

### Convenções de Código

| Convenção           | Padrão                                     |
| ------------------- | ------------------------------------------ |
| Aspas               | Simples (`'string'`)                       |
| Ponto-e-vírgula     | Não usar                                   |
| Indentação          | 2 espaços                                  |
| Nomes de arquivo    | kebab-case (`seller-repository.ts`)        |
| Nomes de componente | PascalCase (`SellerForm.tsx`)              |
| Nomes de função     | camelCase (`getSellers`)                   |
| Nomes de tipo       | PascalCase (`Seller`, `CreateSellerInput`) |

### Variáveis de Ambiente

Criar arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Pipedrive OAuth (MVP)
PIPEDRIVE_CLIENT_ID=xxx
PIPEDRIVE_CLIENT_SECRET=xxx

# HubSpot OAuth (Fase 2+)
HUBSPOT_CLIENT_ID=xxx
HUBSPOT_CLIENT_SECRET=xxx

# OpenAI (Fase 4+)
OPENAI_API_KEY=sk-xxx

# Resend (Fase 2+)
RESEND_API_KEY=re_xxx

# Stripe (Fase 2+)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Schemas Zod

Schemas ficam junto com as Actions que os utilizam.

```typescript
// app/actions/sellers.ts
import { z } from 'zod'

const createSellerSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  organization_id: z.string().uuid(),
})

const updateSellerSchema = createSellerSchema.partial().extend({
  id: z.string().uuid(),
})
```

### Exemplo Completo de Fluxo

#### 1. Type (Model)

```typescript
// types/seller.ts
export type Seller = {
  id: string
  organization_id: string
  name: string
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CreateSellerInput = Omit<Seller, 'id' | 'created_at' | 'updated_at'>
export type UpdateSellerInput = Partial<CreateSellerInput>
```

#### 2. Repository (Acesso ao Banco)

```typescript
// lib/repositories/seller-repository.ts
import { createClient } from '@/lib/supabase-server'
import type { Seller, CreateSellerInput, UpdateSellerInput } from '@/types'

export const sellerRepository = {
  async findById(id: string): Promise<Seller | null> {
    const supabase = await createClient()
    const { data, error } = await supabase.from('sellers').select('*').eq('id', id).single()

    if (error) return null
    return data
  },

  async findByOrganization(orgId: string): Promise<Seller[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('name')

    if (error) throw new Error(error.message)
    return data
  },

  async create(input: CreateSellerInput): Promise<Seller> {
    const supabase = await createClient()
    const { data, error } = await supabase.from('sellers').insert(input).select().single()

    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, input: UpdateSellerInput): Promise<Seller> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sellers')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('sellers').update({ is_active: false }).eq('id', id)

    if (error) throw new Error(error.message)
  },
}
```

#### 3. Server Action (Entry Point)

```typescript
// app/actions/sellers.ts
'use server'

import { z } from 'zod'
import { sellerRepository } from '@/lib/repositories/seller-repository'
import { revalidatePath } from 'next/cache'

// Schema de validação
const createSellerSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  organization_id: z.string().uuid(),
})

// Types de retorno
type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

// Actions
export async function getSellers(orgId: string) {
  return sellerRepository.findByOrganization(orgId)
}

export async function getSellerById(id: string) {
  return sellerRepository.findById(id)
}

export async function createSeller(
  input: z.infer<typeof createSellerSchema>
): Promise<ActionResult<Seller>> {
  // 1. Valida input
  const parsed = createSellerSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  // 2. Chama repository
  try {
    const seller = await sellerRepository.create({
      ...parsed.data,
      is_active: true,
    })

    // 3. Revalida cache da página
    revalidatePath('/vendedores')

    return { success: true, data: seller }
  } catch (err) {
    return { success: false, error: 'Erro ao criar vendedor' }
  }
}

export async function updateSeller(
  id: string,
  input: Partial<z.infer<typeof createSellerSchema>>
): Promise<ActionResult<Seller>> {
  try {
    const seller = await sellerRepository.update(id, input)
    revalidatePath('/vendedores')
    return { success: true, data: seller }
  } catch (err) {
    return { success: false, error: 'Erro ao atualizar vendedor' }
  }
}

export async function deleteSeller(id: string): Promise<ActionResult<void>> {
  try {
    await sellerRepository.delete(id)
    revalidatePath('/vendedores')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: 'Erro ao excluir vendedor' }
  }
}
```

#### 4. Componente (UI)

```typescript
// components/sellers/seller-form.tsx
"use client";

import { useState } from "react";
import { createSeller } from "@/app/actions/sellers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Props = {
  organizationId: string;
  onSuccess?: () => void;
};

export function SellerForm({ organizationId, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await createSeller({
      name,
      email,
      organization_id: organizationId,
    });

    setLoading(false);

    if (result.success) {
      toast.success("Vendedor criado");
      setName("");
      setEmail("");
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
```

#### 5. Página (Composição)

```typescript
// app/(dashboard)/vendedores/page.tsx
import { getSellers } from "@/app/actions/sellers";
import { SellerForm } from "@/components/sellers/seller-form";
import { SellerTable } from "@/components/sellers/seller-table";
import { getOrganizationId } from "@/lib/auth"; // helper que pega org do usuário logado

export default async function VendedoresPage() {
  const orgId = await getOrganizationId();
  const sellers = await getSellers(orgId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vendedores</h1>

      <SellerForm organizationId={orgId} />

      <SellerTable sellers={sellers} />
    </div>
  );
}
```

### Tratamento de Erros

| Camada         | Como tratar                                 |
| -------------- | ------------------------------------------- |
| **Repository** | Lança `Error` com mensagem                  |
| **Service**    | Lança `Error` ou retorna `null`             |
| **Action**     | Retorna `{ success: false, error: string }` |
| **Componente** | Exibe toast com `toast.error()`             |

```typescript
// Padrão de retorno de Action
type ActionResult<T> = { success: true; data: T } | { success: false; error: string }
```

### Como Adicionar Nova Funcionalidade

Exemplo: adicionar listagem de regras de comissão.

**Passo 1:** Criar/atualizar type em `types/rule.ts`

**Passo 2:** Criar repository em `lib/repositories/rule-repository.ts`

- Apenas métodos que serão usados

**Passo 3:** Criar actions em `app/actions/rules.ts`

- Schema Zod para validação
- Actions que chamam repository

**Passo 4:** Criar componentes em `components/rules/`

- `rule-form.tsx` (formulário)
- `rule-table.tsx` (listagem)
- `rule-card.tsx` (card individual)

**Passo 5:** Criar página em `app/(dashboard)/regras/page.tsx`

- Composição dos componentes
- Adicionar rota em `lib/route-config.ts` para título/descrição automático
- Se precisar de botões de ação no header, usar `useHeaderActions()` (ver `doc/layout.md`)

**Passo 6:** Se precisar de lógica complexa, criar service em `lib/services/`

---

### Como Adicionar Nova Integração Externa (Client)

Exemplo: adicionar integração com HubSpot.

**Passo 1:** Criar pasta `lib/clients/hubspot/`

**Passo 2:** Criar types da API em `lib/clients/hubspot/types.ts`

```typescript
// lib/clients/hubspot/types.ts
export type HubSpotDeal = {
  id: string
  properties: {
    dealname: string
    amount: string
    closedate: string
    dealstage: string
  }
}

export type HubSpotTokenResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
}
```

**Passo 3:** Criar auth helpers em `lib/clients/hubspot/auth.ts`

```typescript
// lib/clients/hubspot/auth.ts
const HUBSPOT_AUTH_URL = 'https://app.hubspot.com/oauth/authorize'
const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token'

export function getAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.HUBSPOT_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: 'crm.objects.deals.read',
    state,
  })
  return `${HUBSPOT_AUTH_URL}?${params}`
}

export async function exchangeCode(
  code: string,
  redirectUri: string
): Promise<HubSpotTokenResponse> {
  // ... implementação
}

export async function refreshToken(refreshToken: string): Promise<HubSpotTokenResponse> {
  // ... implementação
}
```

**Passo 4:** Criar client em `lib/clients/hubspot/client.ts`

```typescript
// lib/clients/hubspot/client.ts
import type { HubSpotDeal } from './types'

const BASE_URL = 'https://api.hubapi.com'

export const hubspotClient = {
  async getDeals(accessToken: string): Promise<HubSpotDeal[]> {
    const res = await fetch(`${BASE_URL}/crm/v3/objects/deals`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    return data.results
  },
}
```

**Passo 5:** Criar index para re-export em `lib/clients/hubspot/index.ts`

```typescript
// lib/clients/hubspot/index.ts
export * from './client'
export * from './auth'
export * from './types'
```

**Passo 6:** Se precisar orquestrar com banco, criar/atualizar service em `lib/services/`

**Regras do Client:**

- **NÃO** importar nada de `@/lib/repositories`
- **NÃO** importar nada de `@/types` (usar types próprios do client)
- **NÃO** conhecer domínio do projeto (Sale, Commission, etc.)
- **PODE** usar variáveis de ambiente (`process.env.HUBSPOT_*`)
- **DEVE** ser copiável para outro projeto sem modificações
