# Layout & Componentes de Página

Documentação dos componentes padronizados de estrutura de página.

## PageHeader (Context-based)

O cabeçalho de página é renderizado **uma única vez no layout** (`LayoutPageHeader`). Cada página define seu título/ações via hooks de contexto.

### Arquitetura

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/components/layout/page-header-context.tsx` | `PageHeaderProvider`, `useSetPageHeader`, `useHeaderActions` |
| `src/components/layout/page-header.tsx` | `LayoutPageHeader` — lê do context e renderiza |
| `src/lib/route-config.ts` | Mapa estático rota → título/descrição (fallback) |
| `src/app/(dashboard)/route-page-header.tsx` | Aplica fallback do route-config automaticamente |

### Como funciona

1. O **layout** envolve children com `<PageHeaderProvider>` e renderiza `<LayoutPageHeader />`
2. O `<RoutePageHeader />` aplica título/descrição do `route-config.ts` como fallback
3. Cada **página** pode sobrescrever via hooks:
   - `useSetPageHeader({ title, description?, backHref? })` — define título
   - `useHeaderActions(<JSX>)` — define botões de ação

### Comportamento sticky

O PageHeader é **sempre sticky** (`sticky top-20 md:top-0 z-20 bg-background`). No mobile, compensa a altura do header global (`top-20`). No desktop, usa `top-0`.

### Uso — Página simples (apenas route-config)

Se a rota está em `route-config.ts`, não precisa de hook nenhum. O título aparece automaticamente.

### Uso — Página com ações (client component)

```tsx
'use client'
import { useHeaderActions } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function ClientesClient() {
  useHeaderActions(
    <Button>
      <Plus className="h-4 w-4 md:mr-2" />
      <span className="hidden md:inline">Novo Cliente</span>
    </Button>
  )

  return <div>...</div>
}
```

### Uso — Página com título dinâmico

```tsx
'use client'
import { useSetPageHeader, useHeaderActions } from '@/components/layout'

export function SaleDetail({ sale }: Props) {
  useSetPageHeader({
    title: 'Detalhes da Venda',
    description: `${sale.client_name} - ${sale.date}`,
    backHref: '/minhasvendas',
  })

  useHeaderActions(
    <Button asChild>
      <Link href={`/minhasvendas/${sale.id}/editar`}>Editar</Link>
    </Button>
  )

  return <div>...</div>
}
```

### Uso — Server component com ações

Crie um componente client auxiliar que chama os hooks e retorna `null`:

```tsx
// page-header-setter.tsx
'use client'
import { useHeaderActions } from '@/components/layout'

export function MyPageActions() {
  useHeaderActions(<Button>Ação</Button>)
  return null
}

// page.tsx (server)
import { MyPageActions } from './page-header-setter'

export default function Page() {
  return <>
    <MyPageActions />
    {/* rest of page */}
  </>
}
```

### Regras

- **Nunca importar `PageHeader` diretamente** — use os hooks
- **`useHeaderActions` deve ser chamado incondicionalmente** (regra de hooks). Condições ficam dentro do JSX
- **Ícones em botões**: visíveis sempre, texto visível apenas em telas maiores (`hidden md:inline`)
- **Back button**: usar `backHref` no `useSetPageHeader`
- **Novas rotas simples**: adicionar em `route-config.ts` e não precisa de hook

---

## DataTablePagination

Componente de paginação padronizado para tabelas.

**Localização:** `src/components/ui/data-table-pagination.tsx`

### Props

| Prop               | Tipo                     | Obrigatório | Descrição                                     |
| ------------------ | ------------------------ | ----------- | --------------------------------------------- |
| `page`             | `number`                 | Sim         | Página atual (1-indexed)                      |
| `pageSize`         | `number`                 | Sim         | Itens por página                              |
| `total`            | `number`                 | Sim         | Total de itens                                |
| `onPageChange`     | `(page: number) => void` | Sim         | Callback ao mudar página                      |
| `onPageSizeChange` | `(size: number) => void` | Sim         | Callback ao mudar itens por página            |
| `pageSizeOptions`  | `number[]`               | Não         | Opções de tamanho (default: [10, 15, 25, 50]) |

### Uso

```tsx
import { DataTablePagination } from '@/components/ui/data-table-pagination'

const [page, setPage] = useState(1)
const [pageSize, setPageSize] = useState(15)

<Table>
  {/* ... */}
</Table>

<DataTablePagination
  page={page}
  pageSize={pageSize}
  total={142}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
/>
```

### Padrão Visual

```
┌─────────────────────────────────────────────────────────────┐
│  Mostrando 1-15 de 142  │ 15 ▼ │      ◀ 1 2 3 ... 10 ▶     │
└─────────────────────────────────────────────────────────────┘
```

### Regras

- **Sempre usar** em tabelas com paginação
- **Não exibe** quando `total === 0`
- **Reseta para página 1** automaticamente ao mudar `pageSize`
- **Números de página** com ellipsis inteligente (máx 7 botões visíveis)

---

## SnapForm (Pattern)

Conceito de formulário minimalista do projeto. Não é um componente, é um **padrão de design** para formulários de criação rápida.

### Filosofia

> O vendedor digita o mínimo, clica criar, e sai. Campos extras existem, mas não chamam atenção.

- **Mono-input**: 1 campo principal visível. O vendedor resolve em 5 segundos.
- **Detalhes opcionais**: campos secundários ficam escondidos num `Collapsible`. Só o usuário detalhista abre.
- **Sem overload**: nada de subtítulos redundantes, labels explicativos, ou formulários complexos no momento da criação.

### Estrutura

```
┌──────────────────────────────────────┐
│          Título Centralizado         │  ← DialogHeader text-center
│                                      │
│  Label                               │
│  ┌──────────────────────────────┐    │
│  │  Placeholder como contexto   │    │  ← Input principal h-[50px]
│  └──────────────────────────────┘    │
│                                      │
│  ˅ Detalhes opcionais                │  ← Collapsible trigger
│                                      │
│               [ Cancelar ] [ Criar ] │
└──────────────────────────────────────┘
```

Expandido:

```
┌──────────────────────────────────────┐
│          Título Centralizado         │
│                                      │
│  Label                               │
│  ┌──────────────────────────────┐    │
│  │  Placeholder como contexto   │    │
│  └──────────────────────────────┘    │
│                                      │
│  ˄ Detalhes opcionais                │
│  ┌─────────────────────────────────┐ │
│  │  bg-muted/50 rounded-lg p-4    │ │  ← Container cinza com padding
│  │  Campo secundário 1             │ │
│  │  Campo secundário 2             │ │
│  │  Hint text (texto xs muted)     │ │
│  └─────────────────────────────────┘ │
│                                      │
│               [ Cancelar ] [ Criar ] │
└──────────────────────────────────────┘
```

### Tamanhos e Tokens

| Elemento | Classe | Descrição |
|----------|--------|-----------|
| **Dialog** | `top-[20%] translate-y-0` | Ancorada no topo (evita layout shift ao expandir) |
| **Dialog** | `showCloseButton={false}` | Sem X — tem botão Cancelar |
| **DialogHeader** | `text-center sm:text-center` | Título sempre centralizado |
| **DialogDescription** | `sr-only` | Acessibilidade sem ruído visual |
| **Input principal** | `h-[50px] text-base` | Touch-friendly, destaque visual |
| **Label principal** | `text-base font-semibold` | Hierarquia clara |
| **Collapsible trigger** | `text-sm text-muted-foreground` | Discreto, não compete com o campo principal |
| **Collapsible content** | `mt-3 rounded-lg bg-muted/50 p-4` | Container cinza com respiro |
| **Labels secundárias** | `text-sm text-muted-foreground` | Hierarquia menor que o campo principal |
| **Hint text** | `text-xs text-muted-foreground` | Informação passiva (ex: "configure depois") |

### Animações

- **Collapsible**: `animate-collapsible-down` / `animate-collapsible-up` (keyframes em `globals.css`)
- **Dialog top fixo**: conteúdo cresce pra baixo sem layout shift

### Regras

1. **Máximo 1 campo visível** no estado inicial (fechado)
2. **Placeholder é contexto**, não repetir em label + sublabel + placeholder
3. **Sem subtítulo no header** — título centralizado sozinho respira melhor
4. **Detalhes opcionais em Collapsible** com fundo `bg-muted/50` para separação visual
5. **Ações complexas ficam pra depois** — no SnapForm, crie o registro e redirecione para edição completa
6. **Botões**: Cancelar (outline) + Ação principal (primary), alinhados à direita

### Referência de Implementação

`src/components/suppliers/supplier-dialog.tsx` — primeiro SnapForm do sistema.

### Onde usar

Qualquer formulário de criação rápida: novo cliente, nova venda, novo fornecedor, nova regra, etc.

---

## DashedActionButton

Botão dashed para ações de seção — adicionar valor, configurar pagamento, etc.

**Localização:** `src/components/ui/dashed-action-button.tsx`

### Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `icon` | `ReactNode` | Não | Ícone à esquerda (ex: `<Plus className="h-4 w-4" />`) |
| `prominent` | `boolean` | Não | Seção vazia — aumenta altura para `h-16` e borda mais visível |
| `className` | `string` | Não | Classes extras |
| `children` | `ReactNode` | Sim | Texto do botão |

Herda todas as props de `<button>`.

### Padrão Visual

```
Estado normal (h-12):
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│      [icon]  Texto da ação          │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘

Estado prominent (h-16, seção vazia):
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│                                      │
│      [icon]  Texto da ação           │
│                                      │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```

### Uso

```tsx
import { DashedActionButton } from '@/components/ui/dashed-action-button'
import { Plus } from 'lucide-react'

<DashedActionButton
  icon={<Plus className="h-4 w-4" />}
  prominent={isEmpty}
  onClick={handleAdd}
>
  Adicionar valor
</DashedActionButton>
```

### Regras

- **Cores muted** — cinza discreto, não compete com conteúdo
- **`prominent`** apenas quando a seção está vazia (chama atenção para a primeira ação)
- **Ícone h-4 w-4** — padrão para manter consistência
- **Sempre `type="button"`** — já definido internamente

---

## Componentes Futuros

### EmptyState (Planejado)

Estado vazio padronizado para listagens sem dados.

### DataTableLoading (Planejado)

Skeleton de loading para tabelas.
