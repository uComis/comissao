# Arquitetura

Documentação técnica da estrutura do projeto, padrões e decisões de arquitetura.

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
│   ├── layout/                      # Sidebar, Header
│   ├── sellers/                     # Componentes de vendedores
│   ├── rules/                       # Componentes de regras
│   └── reports/                     # Componentes de relatórios
│
├── contexts/
│   ├── auth-context.tsx             # Usuário logado
│   └── organization-context.tsx     # Organização atual
│
├── hooks/
│   └── use-notifications.ts         # Wrapper do toast
│
├── lib/
│   ├── supabase.ts                  # Cliente Supabase (browser)
│   ├── supabase-server.ts           # Cliente Supabase (server)
│   │
│   ├── repositories/                # Data Access Layer (DAL)
│   │   ├── seller-repository.ts
│   │   ├── rule-repository.ts
│   │   ├── sale-repository.ts
│   │   └── commission-repository.ts
│   │
│   ├── services/                    # Regras de negócio
│   │   ├── commission-service.ts    # Cálculo de comissões
│   │   └── report-service.ts        # Geração de relatórios
│   │
│   ├── commission-engine.ts         # Cálculos puros (decimal.js)
│   ├── pipedrive.ts                 # Client da API Pipedrive
│   └── pdf-generator.ts             # Geração de PDF
│
└── types/                           # Models/Interfaces
    ├── index.ts                     # Re-export de todos
    ├── seller.ts
    ├── rule.ts
    ├── sale.ts
    └── commission.ts
```

## Camadas

| Camada             | Pasta                             | Responsabilidade                               |
| ------------------ | --------------------------------- | ---------------------------------------------- |
| **Páginas**        | `app/(auth)/`, `app/(dashboard)/` | UI, renderização                               |
| **Server Actions** | `app/actions/`                    | Entry point, validação Zod, orquestra services |
| **API Routes**     | `app/api/`                        | Webhooks externos, download de arquivos        |
| **Componentes**    | `components/`                     | UI reutilizável                                |
| **Services**       | `lib/services/`                   | Regras de negócio, orquestra repositories      |
| **Repositories**   | `lib/repositories/`               | Acesso ao banco (DAL)                          |
| **Clients**        | `lib/pipedrive.ts`                | Chamadas a APIs externas                       |
| **Engine**         | `lib/commission-engine.ts`        | Cálculos puros (decimal.js)                    |
| **Types**          | `types/`                          | Models, interfaces, inputs                     |

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

| De              | Para                    | Como                        |
| --------------- | ----------------------- | --------------------------- |
| Frontend        | Backend próprio         | Server Action (RPC)         |
| Backend         | Banco de dados          | Repository → Supabase       |
| Backend         | API externa (Pipedrive) | Client (`lib/pipedrive.ts`) |
| Sistema externo | Backend próprio         | API Route (HTTP)            |

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
import { Decimal } from "decimal.js";
import { saleRepository } from "@/lib/repositories/sale-repository";
import { ruleRepository } from "@/lib/repositories/rule-repository";
import { commissionRepository } from "@/lib/repositories/commission-repository";

export const commissionService = {
  async calculateForPeriod(orgId: string, period: string) {
    // 1. Busca dados de múltiplos repositories
    const sales = await saleRepository.findByPeriod(orgId, period);
    const rules = await ruleRepository.findByOrganization(orgId);

    // 2. Aplica regras de negócio
    const commissions = sales.map((sale) => {
      const rule = rules.find((r) => r.id === sale.rule_id);
      const amount = new Decimal(sale.net_value)
        .times(rule.percentage)
        .dividedBy(100)
        .toDecimalPlaces(2);

      return {
        sale_id: sale.id,
        seller_id: sale.seller_id,
        amount: amount.toNumber(),
      };
    });

    // 3. Persiste resultado
    await commissionRepository.createMany(commissions);

    return commissions;
  },
};
```

### Types (Models)

Types definem a estrutura dos dados em todas as camadas.

```typescript
// types/seller.ts
export type Seller = {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Inputs para criação/atualização
export type CreateSellerInput = Omit<
  Seller,
  "id" | "created_at" | "updated_at"
>;
export type UpdateSellerInput = Partial<CreateSellerInput>;

// Com relações (para queries com JOIN)
export type SellerWithCommissions = Seller & {
  commissions: Commission[];
};
```

```typescript
// types/index.ts - Re-export centralizado
export * from "./seller";
export * from "./rule";
export * from "./sale";
export * from "./commission";
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

# Pipedrive (MVP)
PIPEDRIVE_API_TOKEN=seu_token_aqui

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
import { z } from "zod";

const createSellerSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  organization_id: z.string().uuid(),
});

const updateSellerSchema = createSellerSchema.partial().extend({
  id: z.string().uuid(),
});
```

### Exemplo Completo de Fluxo

#### 1. Type (Model)

```typescript
// types/seller.ts
export type Seller = {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateSellerInput = Omit<
  Seller,
  "id" | "created_at" | "updated_at"
>;
export type UpdateSellerInput = Partial<CreateSellerInput>;
```

#### 2. Repository (Acesso ao Banco)

```typescript
// lib/repositories/seller-repository.ts
import { createClient } from "@/lib/supabase-server";
import type { Seller, CreateSellerInput, UpdateSellerInput } from "@/types";

export const sellerRepository = {
  async findById(id: string): Promise<Seller | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sellers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  },

  async findByOrganization(orgId: string): Promise<Seller[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sellers")
      .select("*")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("name");

    if (error) throw new Error(error.message);
    return data;
  },

  async create(input: CreateSellerInput): Promise<Seller> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sellers")
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: string, input: UpdateSellerInput): Promise<Seller> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sellers")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("sellers")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw new Error(error.message);
  },
};
```

#### 3. Server Action (Entry Point)

```typescript
// app/actions/sellers.ts
"use server";

import { z } from "zod";
import { sellerRepository } from "@/lib/repositories/seller-repository";
import { revalidatePath } from "next/cache";

// Schema de validação
const createSellerSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  organization_id: z.string().uuid(),
});

// Types de retorno
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Actions
export async function getSellers(orgId: string) {
  return sellerRepository.findByOrganization(orgId);
}

export async function getSellerById(id: string) {
  return sellerRepository.findById(id);
}

export async function createSeller(
  input: z.infer<typeof createSellerSchema>
): Promise<ActionResult<Seller>> {
  // 1. Valida input
  const parsed = createSellerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // 2. Chama repository
  try {
    const seller = await sellerRepository.create({
      ...parsed.data,
      is_active: true,
    });

    // 3. Revalida cache da página
    revalidatePath("/vendedores");

    return { success: true, data: seller };
  } catch (err) {
    return { success: false, error: "Erro ao criar vendedor" };
  }
}

export async function updateSeller(
  id: string,
  input: Partial<z.infer<typeof createSellerSchema>>
): Promise<ActionResult<Seller>> {
  try {
    const seller = await sellerRepository.update(id, input);
    revalidatePath("/vendedores");
    return { success: true, data: seller };
  } catch (err) {
    return { success: false, error: "Erro ao atualizar vendedor" };
  }
}

export async function deleteSeller(id: string): Promise<ActionResult<void>> {
  try {
    await sellerRepository.delete(id);
    revalidatePath("/vendedores");
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: "Erro ao excluir vendedor" };
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
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
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

**Passo 6:** Se precisar de lógica complexa, criar service em `lib/services/`
