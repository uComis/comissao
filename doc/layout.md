# Layout & Componentes de Página

Documentação dos componentes padronizados de estrutura de página.

## PageHeader

Cabeçalho padrão para todas as páginas de listagem/gestão.

**Localização:** `src/components/layout/page-header.tsx`

### Props

| Prop          | Tipo        | Obrigatório | Descrição                         |
| ------------- | ----------- | ----------- | --------------------------------- |
| `title`       | `string`    | Sim         | Título principal da página        |
| `description` | `string`    | Não         | Descrição/subtítulo               |
| `children`    | `ReactNode` | Não         | Slot para ações (botões, filtros) |

### Uso

```tsx
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
;<PageHeader title="Meus Clientes" description="Gerencie sua carteira de clientes">
  <Button>
    <Plus className="h-4 w-4 md:mr-2" />
    <span className="hidden md:inline">Novo Cliente</span>
  </Button>
</PageHeader>
```

### Padrão Visual

```
┌─────────────────────────────────────────────────────────────┐
│  Título da Página                              [ Ação ]     │
│  Descrição opcional em texto menor                          │
└─────────────────────────────────────────────────────────────┘
```

### Regras

- **Sempre usar** em páginas de listagem (clientes, vendas, fornecedores, etc.)
- **Botões de ação** ficam no slot `children`, alinhados à direita
- **Ícones em botões**: visíveis sempre, texto visível apenas em telas maiores (`hidden md:inline`)

---

## Páginas que usam

| Página            | Título        | Ações        |
| ----------------- | ------------- | ------------ |
| `/clientes`       | Meus Clientes | Novo Cliente |
| `/minhasvendas`   | Minhas Vendas | Nova Venda   |
| `/fornecedores`   | Minhas Pastas | Adicionar    |
| `/admin/usuarios` | Usuários      | Busca        |

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

## Componentes Futuros

### EmptyState (Planejado)

Estado vazio padronizado para listagens sem dados.

### DataTableLoading (Planejado)

Skeleton de loading para tabelas.
