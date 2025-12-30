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

## Componentes Futuros

### EmptyState (Planejado)

Estado vazio padronizado para listagens sem dados.

### DataTableLoading (Planejado)

Skeleton de loading para tabelas.
