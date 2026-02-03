# Layout & Componentes de Página

Documentação dos componentes padronizados de estrutura de página.

## Estrutura Geral do Layout

O layout do dashboard (`src/app/(dashboard)/layout.tsx`) tem duas variações responsivas:

```
Desktop (md+):
┌──────────┬─────────────────────────────────────────┐
│          │  [≡] Título          [✨] [Ações]       │ ← LayoutPageHeader (sticky)
│ Sidebar  ├─────────────────────────────────────────┤
│          │                                         │
│          │            Conteúdo                     │
│          │                                         │
└──────────┴─────────────────────────────────────────┘

Mobile:
┌─────────────────────────────────────────┐
│  Logo / ← Título     [✨] [Ações] [👤] │ ← Header (sticky, unificado)
├─────────────────────────────────────────┤
│                                         │
│            Conteúdo                     │
│                                         │
├─────────────────────────────────────────┤
│  🏠  📊  💰  📋  ☰                     │ ← BottomNav (fixed)
└─────────────────────────────────────────┘
```

### Hierarquia de providers

```
CurrentUserProvider → AiChatProvider → SidebarProvider → PageHeaderProvider
```

---

## PageHeader (Context-based)

O cabeçalho de página é gerenciado via contexto. **Desktop** renderiza `LayoutPageHeader`, **mobile** renderiza `Header`. Ambos leem do mesmo contexto.

### Arquitetura

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/components/layout/page-header-context.tsx` | `PageHeaderProvider`, `useSetPageHeader`, `useHeaderActions`, `usePageHeader`, `usePageHeaderActions` |
| `src/components/layout/page-header.tsx` | `LayoutPageHeader` — header desktop (título, ações, botão IA) |
| `src/components/layout/header.tsx` | `Header` — header mobile unificado (logo/título, ações, IA, avatar) |
| `src/components/layout/bottom-nav.tsx` | `BottomNav` — navegação mobile (ou barra de ações em taskMode) |
| `src/lib/route-config.ts` | Mapa estático rota → título/backHref (fallback) |
| `src/app/(dashboard)/route-page-header.tsx` | Aplica fallback do route-config automaticamente |

### Estado do contexto

```ts
type PageHeaderState = {
  title: string
  backHref?: string
  taskMode?: boolean  // modo formulário — header mínimo + bottom bar de ações
}
```

> **Nota:** O campo `description` foi removido. Headers exibem apenas título.

### Como funciona

1. O **layout** envolve children com `<PageHeaderProvider>`
2. O `<RoutePageHeader />` aplica título do `route-config.ts` como fallback
3. Cada **página** pode sobrescrever via hooks:
   - `useSetPageHeader({ title, backHref?, taskMode? })` — define título e comportamento
   - `useHeaderActions(<JSX>)` — define botões de ação

### Comportamento por breakpoint

| Componente | Mobile | Desktop |
|-----------|--------|---------|
| `Header` | Visível (`md:hidden`) | Oculto |
| `LayoutPageHeader` | Oculto | Visível (`hidden md:block`) |
| `BottomNav` | Visível (`md:hidden`) | Oculto |
| `AppSidebar` | Oculto | Visível |

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
- **Sem description/sublabel** — headers exibem apenas título

---

## Header Mobile Unificado

**Localização:** `src/components/layout/header.tsx`

Barra superior única no mobile com 3 modos:

### 1. Home (`/home`, `/dashboard`, `/`)

```
┌─────────────────────────────────────────┐
│  [uComis logo]              [✨] [👤]   │
└─────────────────────────────────────────┘
```

Logo à esquerda, spacer flex-1, botão IA + avatar à direita.

### 2. Página interna (ex: `/minhasvendas`)

```
┌─────────────────────────────────────────┐
│  ← Minhas Vendas    [✨] [Ações] [👤]  │
└─────────────────────────────────────────┘
```

Back + título com `flex-1` (trunca se necessário), botão IA + ações + avatar à direita.

### 3. Task mode (formulários)

```
┌─────────────────────────────────────────┐
│  ← Registro de venda                    │
└─────────────────────────────────────────┘
```

Header mínimo — apenas back + título. Sem IA, sem avatar. Ações vão para o BottomNav.

### Botão de IA

O ícone `Sparkles` (lucide-react) fica **sempre à esquerda** dos botões de ação, com `ml-1` de separação quando há ações. Abre o chat via `useAiChat().toggle`.

---

## Task Mode

Modo especial para páginas de formulário (nova venda, editar venda). Ativado via `taskMode: true` no `useSetPageHeader`.

### Comportamento

| Elemento | Normal | Task Mode |
|----------|--------|-----------|
| Header mobile | Completo (logo/título + IA + ações + avatar) | Mínimo (back + título) |
| BottomNav | Navegação (5 itens) | Barra de ações (Cancelar + Salvar) |
| LayoutPageHeader (desktop) | Normal | Normal (sem alteração) |

### Uso

```tsx
useSetPageHeader({ title: 'Registro de venda', backHref: '/minhasvendas', taskMode: true })
useHeaderActions(
  <>
    <Button variant="outline" asChild><Link href="/minhasvendas">Cancelar</Link></Button>
    <Button type="submit" form="sale-form">Salvar Venda</Button>
  </>
)
```

No mobile, os botões Cancelar/Salvar aparecem no bottom bar fixo. No desktop, aparecem no header normalmente.

### Onde usar

Qualquer página de formulário full-page: nova venda, editar venda, etc.

---

## BottomNav

**Localização:** `src/components/layout/bottom-nav.tsx`

Navegação fixa no rodapé do mobile (`md:hidden`).

### Modo normal

5 itens de navegação + popover Menu com toggle de tema (Sol/Lua).

```
┌─────────────────────────────────────────┐
│  🏠 Home  📊 Vendas  💰 Fat.  📋 Clientes  ☰ Menu │
└─────────────────────────────────────────┘
```

### Modo taskMode

Substitui a navegação por uma barra de ações alinhada à direita.

```
┌─────────────────────────────────────────┐
│                    [ Cancelar ] [ Salvar ] │
└─────────────────────────────────────────┘
```

---

## Botão de IA (Sparkles)

**Contexto:** `src/components/ai-assistant/ai-chat-context.tsx`

O botão de IA aparece em **todos os headers** (mobile e desktop), posicionado à esquerda dos botões de ação.

### Arquitetura

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/components/ai-assistant/ai-chat-context.tsx` | `AiChatProvider`, `useAiChat` — estado open/toggle |
| `src/components/ai-assistant/ai-chat-window.tsx` | Janela de chat renderizada pelo provider |

### Posicionamento

- **Desktop** (`LayoutPageHeader`): `[✨] [ml-2] [Ações]`
- **Mobile** (`Header`): `[✨] [ml-1] [Ações] [👤]`
- **Task mode mobile**: não aparece (header mínimo)

### Uso

```tsx
import { useAiChat } from '@/components/ai-assistant'

const { toggle: toggleAiChat } = useAiChat()

<Button variant="ghost" size="icon" onClick={toggleAiChat}>
  <Sparkles className="h-4 w-4" />
</Button>
```

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

## MonthPicker

Seletor inline de mês com navegação por chevrons. Usado em listagens que filtram por mês.

**Localização:** `src/components/dashboard/month-picker.tsx`

### Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `value` | `Date` | Sim | Mês selecionado (dia 1 do mês) |
| `onChange` | `(date: Date) => void` | Sim | Callback ao mudar mês |

### Padrão Visual

```
◀  Janeiro 2025  ▶
```

- Chevron direito desabilitado quando no mês atual
- Label em português capitalizado (ex: "Fevereiro 2025")
- `min-w-[130px]` no label para evitar layout shift

### Uso

```tsx
import { MonthPicker } from '@/components/dashboard/month-picker'

const [month, setMonth] = useState(() => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
})

<MonthPicker value={month} onChange={setMonth} />
```

### Onde é usado

- `/minhasvendas` — filtro de mês (desktop Card + mobile Card, sempre visível)

---

## OptionPicker

Seletor inline de opções com navegação por chevrons. Mesmo padrão visual do MonthPicker, mas para listas de opções estáticas.

**Localização:** `src/components/dashboard/option-picker.tsx`

### Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `options` | `OptionPickerItem<T>[]` | Sim | Lista de opções `{ value, label }` |
| `value` | `T` | Sim | Valor selecionado |
| `onChange` | `(value: T) => void` | Sim | Callback ao mudar opção |

```ts
type OptionPickerItem<T extends string> = {
  value: T
  label: string
}
```

### Padrão Visual

```
◀  A receber  ▶
```

- Chevron esquerdo desabilitado na primeira opção
- Chevron direito desabilitado na última opção
- `min-w-[100px]` no label para evitar layout shift

### Uso

```tsx
import { OptionPicker, type OptionPickerItem } from '@/components/dashboard/option-picker'

const STATUS_OPTIONS: OptionPickerItem<FilterStatus>[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'A receber' },
  { value: 'overdue', label: 'Atrasados' },
  { value: 'received', label: 'Recebidos' },
]

<OptionPicker options={STATUS_OPTIONS} value={filterStatus} onChange={setFilterStatus} />
```

### Onde é usado

- `/recebiveis` — filtro de status (desktop Card + mobile Card, sempre visível)

---

## Componentes Futuros

### EmptyState (Planejado)

Estado vazio padronizado para listagens sem dados.

### DataTableLoading (Planejado)

Skeleton de loading para tabelas.
