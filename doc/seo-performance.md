# SEO & Performance — Landing Page uComis

> Documento de referência para SEO, performance e acessibilidade da landing page.
> Atualizado em 10/02/2026 — scores pós Fase 7.

## Scores atuais (PageSpeed Insights — mobile)

| Categoria | Score |
|-----------|-------|
| **Performance** | **94** |
| **Acessibilidade** | **100** |
| **SEO** | **100** |
| **Práticas recomendadas** | **100** |

### Evolução do Performance score

```
57 → 87 → 89 → 90 → 91 → 89 → 94
```

### Métricas detalhadas (mobile)

| Métrica | Valor | Status |
|---------|-------|--------|
| FCP | 1.2s | Verde |
| LCP | 3.0s | Verde |
| TBT | 10ms | Verde |
| CLS | 0 | Verde |
| Speed Index | 2.1s | Verde |

---

## Estrutura da landing page

```
src/app/page.tsx (/)
├── Header          → nav fixo, CTAs de login
├── Hero            → H1 + subtítulo + CTA principal
├── Problema        → H2 + descrição da dor
├── Seamless        → H2 + features cadastro rápido
├── Simple          → H2 + features dashboard
├── Understandable  → H2 + features multi-pasta
├── FeaturesShowcase→ H2 + 3 cards
├── Seguranca       → H2 + 3 cards de segurança
├── Confidence      → H2 + desktop mockup (vídeo)
├── Precos          → H2 + cards de planos
├── Faq             → H2 + 7 perguntas (FAQPage schema)
├── CtaFinal        → H2 + CTA final
└── Footer          → links, legal, social
```

Seções em: `src/app/site/secoes/`

---

## SEO técnico

### Metadata
- **Title:** "uComis — Controle de Comissoes para Vendedores" (50 chars)
- **Description:** 155 chars com keywords principais
- **OpenGraph + Twitter Cards:** completos
- **Canonical:** `https://ucomis.com`
- **Arquivo:** `src/app/layout.tsx`

### Dados estruturados (JSON-LD)
- `SoftwareApplication` (nome, categoria, ofertas)
- `FAQPage` (7 perguntas baseadas em People Also Ask)
- `Organization` (marca)
- **Arquivo:** `src/app/page.tsx`

### Indexacao
- **sitemap.ts** — 5 paginas publicas (`src/app/sitemap.ts`)
- **robots.ts** — bloqueia rotas internas (`src/app/robots.ts`)
- **Search Console** — propriedade tipo "Dominio" (`sc-domain:ucomis.com`), sitemap processado

### Favicon e OG Image
- **Favicon:** `src/app/icon.svg` (barra + circulo azul)
- **OG Image:** `src/app/opengraph-image.tsx` (1200x630, gradiente com logo e tagline)

---

## Performance — decisoes tecnicas

### Fontes
- **Landing page** usa apenas **Geist Sans** (Inter removida do root layout)
- **App (dashboard/auth)** usa **Inter** (carregada via sub-layouts)
- Inter definida em `src/lib/fonts.ts`, importada em `src/app/(dashboard)/layout.tsx`, `src/app/(auth)/layout.tsx` e `src/app/impressao/layout.tsx`
- `globals.css` usa `var(--font-inter, system-ui)` com fallback para quando Inter nao esta definida

### Code-splitting
- **Supabase SDK** isolado da landing: `providers.tsx` usa `import()` condicional (so carrega em rotas do app)
- **GoogleOneTap** (`src/components/google-one-tap.tsx`): `import('@/lib/supabase')` dinamico dentro do callback (Supabase so carrega quando o script Google esta pronto)
- **Framer Motion** eliminado da landing via `prefetch={false}` nos Links para `/login` e `/home`

### Imagens
- Imagens **cropadas** (`_cropped.png`) para secoes com `visiblePercent` (reduz payload ~40%)
- Hero image com `priority={true}` e `fetchPriority="high"` — gera `<link rel="preload">` automatico
- Videos com **lazy-load** via IntersectionObserver (so carregam no scroll)

### Animacoes
- Hero usa **CSS puro** (`@keyframes heroFadeUp`) em vez de Framer Motion
- Secoes usam `ScrollReveal` com IntersectionObserver (CSS transitions, sem lib)

---

## Acessibilidade — decisoes tecnicas

### Cores (sistema de 2 tokens)

| Token | Hex | Contraste | Uso |
|-------|-----|-----------|-----|
| `landing-primary` | `#409EFF` | 2.76:1 (falha AA) | Icones, labels, bordas, tints, AvatarFallback |
| `landing-cta` | `#0F62B9` | 6.05:1 (passa AA) | Botoes CTA com texto branco |

- Regra: texto branco em fundo colorido → `landing-cta`. Decorativo → `landing-primary`.
- Documentado tambem em `doc/ui-design.md`
- Definidos em `src/app/globals.css` (`:root` e `@theme inline`)

### Headings
- Exatamente 1 `<h1>` (Hero). Todas as secoes usam `<h2>`.
- Subtitulos internos (que eram `<h4>`/`<h5>`) trocados por `<span>` para manter sequencia h1→h2 limpa.

### Video
- `<track kind="captions">` com VTT vazio (`public/captions/empty.vtt`) no DesktopMockup — obrigatorio pelo Lighthouse mesmo para videos sem audio.

---

## Arquivos-chave

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/app/layout.tsx` | Metadata (title, description, OG, twitter, canonical) |
| `src/app/page.tsx` | JSON-LD schema, composicao das secoes |
| `src/app/globals.css` | Tokens de cor, font-sans, fallback system-ui |
| `src/app/sitemap.ts` | 5 paginas publicas |
| `src/app/robots.ts` | Regras de crawling |
| `src/app/icon.svg` | Favicon |
| `src/app/opengraph-image.tsx` | Imagem de compartilhamento social |
| `src/lib/fonts.ts` | Configuracao compartilhada da fonte Inter |
| `src/components/ui/phone-mockup.tsx` | Mockup com priority, fetchPriority, imagens cropadas |
| `src/components/ui/desktop-mockup.tsx` | Video mockup com lazy-load e captions |
| `src/components/google-one-tap.tsx` | Import dinamico do Supabase |
| `src/components/layout/providers.tsx` | Code-split Supabase (import condicional) |
| `src/middleware.ts` | Rotas publicas em SITE_PAGES (~linha 90) |
| `doc/ui-design.md` | Design system (tokens de cor da landing) |
| `public/captions/empty.vtt` | Captions vazio para video sem audio |

---

## Diagnosticos restantes (Lighthouse mobile)

| Item | Economia estimada | Nota |
|------|-------------------|------|
| JS nao usado | ~27 KiB | Provavelmente next-themes + lucide-react residual |
| JS legado | ~14 KiB | Polyfills para browsers antigos (Next.js gera automaticamente) |
| 1 long task | — | Hidratacao inicial do React |

Esses itens tem retorno marginal e risco de complexidade desproporcional. O score 94 esta muito bom para mobile.

---

## Infraestrutura

- **Dominio:** `ucomis.com` (GoDaddy, DNS TXT do Google adicionado)
- **Deploy:** Vercel, automatico no push para `main`
- **URL publica:** `www.ucomis.com` (redirect de `ucomis.com` → `www`)
- **Search Console:** propriedade tipo "Dominio" (`sc-domain:ucomis.com`)
- **Canonical:** `https://ucomis.com`
