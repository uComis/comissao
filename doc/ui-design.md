# Design System & UI Guidelines

## Paleta de Cores

### Cores do Sistema (Base)
Definidas semanticamente para suportar Light/Dark mode.

| Token | Light Mode (Hex aprox.) | Dark Mode (Hex aprox.) | Uso |
|-------|-------------------------|------------------------|-----|
| **Primary** | Preto (`#1a1a1a`) | Branco (`#ededed`) | Ações principais, textos fortes, botões primários |
| **Secondary** | Cinza Claro (`#f5f5f5`) | Cinza Escuro (`#262626`) | Elementos de apoio, fundos secundários |
| **Destructive** | Vermelho (`#ef4444`) | Vermelho (`#7f1d1d`) | Ações destrutivas (excluir), erros críticos |
| **Background** | Branco (`#ffffff`) | Preto (`#0a0a0a`) | Fundo da página e cards |

### Cores de Status (Semânticas) / Cores de Ação
Cores fixas para feedback e estados do sistema.

| Token | Cor | Hex | Uso |
|-------|-----|-----|-----|
| **Info** / **Cor de ação azul** | Azul | `#409eff` | Informações neutras, links, status "Em andamento" |
| **Warning** / **Cor de ação amarela** | Amarelo/Âmbar | `#f59e0b` | Alertas, atenção, status "Pendente", "Aguardando" |
| **Success** / **Cor de ação verde** | Verde | `#67C23A` | Confirmações, sucesso, status "Pago", "Concluído" |
| **Danger** / **Cor de ação vermelha** | Vermelho Suave | `#F56C6C` | Erros, falhas, alertas críticos (Alternativa ao Destructive) |

## Tipografia
Utilizamos a família de fontes padrão do sistema (Geist Sans / Geist Mono).

## Componentes (Shadcn/UI)
O sistema utiliza componentes baseados em Radix UI + Tailwind CSS.
Consulte `src/components/ui` para a biblioteca de componentes.


