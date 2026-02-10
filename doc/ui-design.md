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

### Cores da Landing Page

Sistema de duas cores para a landing page: a cor da **marca** (logo) e a cor de **ação** (CTAs).

| Token | Hex | Contraste c/ branco | Classe Tailwind | Uso |
|-------|-----|---------------------|-----------------|-----|
| **landing-primary** | `#409EFF` | 2.76:1 | `text-landing-primary`, `bg-landing-primary` | Cor da **marca/logo**: ícones decorativos, labels, bordas, gradientes, tints (`/10`, `/20`), AvatarFallback |
| **landing-cta** | `#0F62B9` | 6.05:1 (WCAG AA) | `bg-landing-cta`, `hover:bg-landing-cta/90` | Cor de **ação**: botões CTA com texto branco, toggles interativos |

**Regra prática:** Se o elemento tem `text-white` sobre fundo colorido → usar `landing-cta`. Se é decorativo (ícone, borda, tint) → usar `landing-primary`.

**Por que duas cores?** O azul da logo (`#409EFF`) é vibrante mas falha no contraste WCAG para texto branco (2.76:1 < 4.5:1). O `#0F62B9` é o mesmo hue (~210°) porém mais escuro, passando WCAG AA com folga (6.05:1).

## Tipografia
Utilizamos a família de fontes padrão do sistema (Geist Sans / Geist Mono).

## Componentes (Shadcn/UI)
O sistema utiliza componentes baseados em Radix UI + Tailwind CSS.
Consulte `src/components/ui` para a biblioteca de componentes.

## Overlay Padrão

Todos os modais e drawers do projeto usam o mesmo overlay, definido globalmente em `globals.css` via `@layer base`:

| Propriedade | Valor |
|-------------|-------|
| **Background** | `bg-black/25` (25% opacidade) |
| **Blur** | `backdrop-blur-[4px]` |

Aplicado automaticamente nos componentes `Dialog` e `Drawer` via seletores `[data-slot="dialog-overlay"]` e `[data-slot="drawer-overlay"]`. Não definir overlay inline nos componentes UI — o global cuida disso.

## Animações

### Accordion / Collapsible

Keyframes disponíveis em `globals.css`:

| Animação | Variável CSS | Uso |
|----------|-------------|-----|
| `accordion-down` / `accordion-up` | `--radix-accordion-content-height` | Componente `Accordion` |
| `collapsible-down` / `collapsible-up` | `--radix-collapsible-content-height` | Componente `Collapsible` |

**Importante:** Accordion e Collapsible usam variáveis CSS diferentes do Radix. Não misturar.

```tsx
// Collapsible - usar animate-collapsible-*
<CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">

// Accordion - usar animate-accordion-*
<AccordionContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
```
