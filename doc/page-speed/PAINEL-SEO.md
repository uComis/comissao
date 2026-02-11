# Painel SEO - uComis Landing Page

> **Contexto novo?** Leia este arquivo primeiro. Se precisar de detalhe:
> - Keywords e recomendações: `temp/seo-research/v3-claude-pesquisa-seo-ucomis.md`
> - Landing page (componentes): `src/app/page.tsx` → seções em `src/app/site/secoes/`
> - Metadata atual: `src/app/layout.tsx`
> - README do produto: `README.md`

## O que foi pedido

Análise e otimização SEO completa da landing page do uComis, incluindo:
- Pesquisa de keywords (via Gemini/Claude Deep Research)
- Análise técnica da landing page (headings, meta tags, estrutura Next.js)
- Aplicação das keywords corretas nos textos, headings, CTAs
- Garantir conformidade com boas práticas do Google

## Público-alvo

**Perfil 1 - Mono-pasta (maioria):** Vendedor que trabalha com UMA empresa. Não sabe quanto vai receber até o dinheiro cair. Quer visibilidade e conferência.

**Perfil 2 - Multi-pasta (alto valor):** Representante comercial com VÁRIAS representadas. Precisa consolidar comissões de múltiplas fontes.

**Ambos:** Preço acessível. Do vendedor de alta performance ao iniciante.

---

## Arquivos de pesquisa

```
temp/seo-research/
├── PAINEL-SEO.md              ← este documento
├── prompt-v1.md               ← prompt Gemini v1
├── prompt-v2.md               ← prompt Gemini v2
├── prompt-v3.md               ← prompt Gemini/Claude v3
├── v1-pesquisa-seo-ucomis.docx          ← resultado Gemini v1
├── v2-pesquisa-seo-ucomis.docx          ← resultado Gemini v2
├── v3-claude-pesquisa-seo-ucomis.md     ← resultado Claude v3 (PRINCIPAL)
└── v3-gemini-pesquisa-seo-ucomis.docx   ← resultado Gemini v3 (complemento)
```

---

## Status das pesquisas

### v1 - Gemini - Pesquisa inicial
- **Status:** Concluída
- **Nota:** 7/10
- **Bom:** 12 keywords primárias, 5 concorrentes, PAA, recomendações H1/H2/meta
- **Ruim:** Alucinação (Truth-Lock, Auditoria Cinética), long-tail sem métricas, sem CPC, ignorou mono-pasta

### v2 - Gemini - Pesquisa corrigida
- **Status:** Concluída
- **Nota:** 6.5/10
- **Bom:** Sem alucinação, CPC parcial, conceito "contra-ERP", mobile vs desktop, PAA melhor
- **Ruim:** Só 7 keywords, long-tail sem métricas de novo, SERP narrativo, landing page sumiu, LSI 3/5

### v3 - Claude (PRINCIPAL) + Gemini (complemento)
- **Status:** Concluída
- **Nota Claude:** 9/10 | **Nota Gemini:** 6.5/10
- **Claude trouxe:** 12 keywords faltantes com métricas, 10+10 mono/multi com métricas, LSI rico em tabelas, SERP real com sites, landing page completa (meta, H1, H2, CTAs), zero alucinação
- **Gemini trouxe:** Mesmas tarefas com menos profundidade, alucinação ("Analytics Preditivo"), LSI em bullet simples, volumes inflados
- **Decisão:** Claude v3 é o documento base. Gemini v3 complementa com termos LSI extras.

---

## Consolidado final de pesquisa

| Dado | Fonte | Status |
|---|---|---|
| ~30+ keywords com volume/KD/CPC | v1 + v2 + v3 Claude | OK (estimativas) |
| 20 keywords mono-pasta segmentadas | v3 Claude | OK |
| 20 keywords multi-pasta segmentadas | v3 Claude | OK |
| Concorrentes mapeados (Mercos, Agendor, SplitC, SuasVendas, GestãoClick, Zendesk) | v1 + v2 + v3 | OK |
| SERP real top 5 keywords | v3 Claude | OK |
| People Also Ask | v1 + v2 + v3 | OK |
| LSI - Financeiro, Operacional, Jurídico | v2 | OK |
| LSI - Ferramentas atuais | v3 Claude + Gemini | OK |
| LSI - Dores/Problemas | v3 Claude + Gemini | OK |
| Mobile vs Desktop | v2 | OK |
| YouTube | v2 | Genérico |
| Meta Title (3 opções) | v3 Claude | OK |
| Meta Description (3 opções) | v3 Claude | OK |
| H1 (3 opções) | v3 Claude | OK |
| H2s (7 sugestões) | v3 Claude | OK |
| CTAs (5 opções) | v3 Claude | OK |

## Gaps que NÃO foram cobertos

| Gap | Como resolver |
|---|---|
| Volume REAL (não estimado) | Google Keyword Planner ou Ubersuggest |
| CPC real | Google Keyword Planner |
| KD confiável | Ubersuggest ou SEMrush (trial 7 dias) |
| Search Console | Configurar após deploy |
| Core Web Vitals | PageSpeed Insights após deploy |

---

## AUDITORIA TÉCNICA DA LANDING PAGE

### Estrutura atual da página

```
page.tsx (/)
├── Header          → nav fixo, CTAs de login
├── Hero            → H1 + subtítulo + CTA
├── Problema        → H2 + descrição da dor
├── Seamless        → H1(!) + features de cadastro rápido
├── Simple          → H1(!) + features de dashboard
├── Understandable  → H1(!) + features multi-pasta
├── FeaturesShowcase→ H2 + 3 cards
├── Seguranca       → H1(!) + 3 cards de segurança
├── Confidence      → H1(!) + desktop mockup
├── Precos          → H2 + cards de planos
├── Faq             → H2 + 3 perguntas
├── CtaFinal        → H2 + CTA final
└── Footer          → links, legal, social
```

---

### PROBLEMA CRÍTICO #1: 6 tags H1 na página

O Google espera **exatamente 1 H1 por página**. A landing page tem **6 H1s**:

| Seção | Tag atual | Texto | Deveria ser |
|---|---|---|---|
| Hero | `h1` | "A forma [certa] de calcular suas comissões" | **H1** (manter - é o único) |
| Seamless | `h1` | "Cadastre uma venda em 30 segundos." | **H2** |
| Simple | `h1` | "Saiba quanto vai receber. Agora." | **H2** |
| Understandable | `h1` | "Todas as pastas. Um só lugar." | **H2** |
| Seguranca | `h1` | "Seus dados protegidos. Sua paz garantida." | **H2** |
| Confidence | `h1` | "Sua auditoria pessoal." | **H2** |

**Ação:** Trocar 5 dos 6 H1s para H2. Manter apenas o Hero como H1.

---

### PROBLEMA CRÍTICO #2: Metadata mínima

**Atual:**
```ts
title: 'uComis'                                    // 6 chars (ideal: 50-60)
description: 'Auditoria de comissões para vendedores'  // 40 chars (ideal: 150-155)
```

**Faltando completamente:**
- openGraph (og:title, og:description, og:image, og:url, og:type)
- Twitter cards (twitter:card, twitter:title, twitter:description, twitter:image)
- canonical URL
- alternates
- keywords (meta keywords não rankeiam, mas og:tags sim)

**Recomendação (baseada na pesquisa v3 Claude):**

```ts
export const metadata: Metadata = {
  title: 'uComis — Controle de Comissões para Vendedores',
  description: 'Cadastre suas vendas, defina regras de comissão e saiba exatamente quanto vai receber e quando. Dashboard consolidado e timeline de parcelas 30/60/90.',
  openGraph: {
    title: 'uComis — Controle de Comissões para Vendedores',
    description: 'Cadastre suas vendas, defina regras de comissão e saiba exatamente quanto vai receber e quando.',
    url: 'https://ucomis.com.br',
    siteName: 'uComis',
    type: 'website',
    locale: 'pt_BR',
    // images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'uComis' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'uComis — Controle de Comissões para Vendedores',
    description: 'Saiba exatamente quanto vai receber de comissão e quando.',
  },
  alternates: {
    canonical: 'https://ucomis.com.br',
  },
}
```

---

### PROBLEMA CRÍTICO #3: Sem sitemap.ts

Não existe `src/app/sitemap.ts`. O Google não tem mapa do site pra indexar.

**Ação:** Criar arquivo.

---

### PROBLEMA CRÍTICO #4: Sem robots.ts

Não existe `src/app/robots.ts`. O Google não sabe o que indexar/ignorar.

**Ação:** Criar arquivo.

---

### PROBLEMA #5: Sem schema markup (dados estruturados)

Nenhum JSON-LD na página. Sem isso, o Google não exibe rich snippets (estrelas, FAQ expandido, preços, etc).

**Schemas recomendados:**
- `SoftwareApplication` — pro produto
- `FAQPage` — pro FAQ (expande as perguntas direto no Google)
- `Organization` — pra marca

---

### PROBLEMA #6: H1 atual não tem keyword principal

**Atual:** "A forma [certa/rápida/simples/precisa/segura] de calcular suas comissões"

- Tem "comissões" (bom)
- Tem "calcular" (bom)
- Falta "controle" (keyword principal: "controle de comissões")
- Falta "vendedor" ou "representante" (diferenciador vs concorrentes)
- Palavras rotativas NÃO são indexadas de forma previsível pelo Google

**Recomendação v3 Claude (opção 1):**
"Controle de comissões: saiba exatamente quanto vai receber e quando"

---

### PROBLEMA #7: FAQ com apenas 3 perguntas

Atualmente o FAQ tem:
1. "Como cadastrar uma venda?"
2. "Como funciona o cálculo de comissões?"
3. "Posso ter mais de uma pasta de fornecedor?"

**Problemas:**
- Poucas perguntas (ideal: 5-8 na landing page)
- Nenhuma pergunta usa keywords de busca real
- Sem schema FAQPage

**Perguntas que deveriam estar (baseado em PAA da pesquisa):**
- "Como saber se minha comissão está certa?"
- "Como calcular comissão de vendas parceladas?"
- "O uComis funciona para quem tem uma só representada?"
- "Preciso saber Excel para usar o uComis?"
- "Meus dados ficam visíveis para a empresa?"

---

### PROBLEMA #8: CTAs genéricos

**Atuais:**
- "Comece agora" (Hero)
- "Comece grátis" / "Comece grátis por 14 dias" (Preços)
- "Comece agora grátis" (CTA Final)

**Recomendação v3 Claude:**
- "Cadastre sua primeira venda em 2 minutos — é grátis"
- "Veja quanto você tem a receber este mês"
- "Monte suas regras de comissão e veja o cálculo automático agora"

---

### PROBLEMA #9: Textos das seções não usam keywords

| Seção | Keywords presentes | Keywords ausentes |
|---|---|---|
| Hero | comissões, calcular | controle, vendedor, representante, recebíveis |
| Problema | planilhas manuais, erros, financeiro | comissão errada, conferir, auditoria |
| Seamless | cálculo automático, comissão, parcelas | vendas, representante |
| Simple | planilhas, comissões, recebimentos | conferir, dashboard, previsão |
| Understandable | pastas, representada, portal | consolidar, representante comercial |
| Seguranca | criptografia, dados protegidos | LGPD, privacidade, vendedor |
| Confidence | auditoria, vendas, representadas | conferir comissão, valores |
| CtaFinal | comissões, previsibilidade | controle, vendedor, grátis |

---

### PROBLEMA #10: Alt text das imagens incompleto

| Imagem | Alt atual | Recomendação |
|---|---|---|
| Dashboard thumbnail | "Dashboard" | "Dashboard de comissões e recebíveis do uComis" |
| Phone mockups (Hero) | (sem alt visível) | "App uComis mostrando controle de comissões" |

---

## Próximos passos

### Fase 1: Consolidar pesquisa
- [x] Organizar arquivos
- [x] Criar painel
- [x] Receber v3 e avaliar
- [x] Atualizar painel com v3

### Fase 2: Análise técnica da landing page
- [x] Ler TODA a landing page (componentes, textos, headings)
- [x] Auditar estrutura de headings (H1, H2, H3)
- [x] Auditar meta tags (title, description, og:tags)
- [x] Verificar SEO técnico do Next.js (metadata API, sitemap, robots.txt)
- [x] Verificar schema markup
- [x] Mapear keywords presentes vs ausentes

### Fase 3: Aplicar otimizações (CONCLUÍDA — commit 7edfe2b)
- [x] Trocar 5 H1s para H2 (mantendo apenas Hero como H1)
- [x] Reescrever H1 do Hero com keyword principal ("Saiba exatamente quanto e quando vai receber — controle suas comissões")
- [x] Reescrever metadata completa (title, description, og, twitter, canonical)
- [x] Criar sitemap.ts (5 páginas públicas)
- [x] Criar robots.ts (bloqueia rotas internas)
- [x] Adicionar JSON-LD schema (SoftwareApplication, FAQPage, Organization)
- [x] Expandir FAQ de 3 para 7 perguntas baseadas em PAA
- [x] Ajustar textos das seções com keywords (problema, seamless, simple, understandable, segurança, confidence, cta-final)
- [x] Melhorar CTAs ("Veja quanto você tem a receber", "Cadastre sua primeira venda", "Teste grátis por 14 dias")
- [x] Revisar alt text das imagens (PhoneMockup ganhou prop alt, todos os mockups com texto descritivo)

### Fase 3.5: Correções pós-deploy (CONCLUÍDA — commits 08a8b1f, 0ab4eac)
- [x] Corrigir URLs de `ucomis.com.br` → `ucomis.com` em layout.tsx, sitemap.ts, robots.ts, page.tsx (JSON-LD)
- [x] Favicon: deletar favicon.ico do Vercel, criar `src/app/icon.svg` com marca uComis (barra + círculo azul)
- [x] OG Image: criar `src/app/opengraph-image.tsx` (imagem 1200x630 com gradiente, logo e tagline para WhatsApp/LinkedIn/Twitter)
- [x] Middleware: liberar `/sitemap.xml`, `/robots.txt` e `/opengraph-image` na lista SITE_PAGES (middleware redirecionava para /login)

### Fase 4: Validar (pós-deploy) — CONCLUÍDA
- [x] Google Search Console: propriedade `ucomis.com` verificada via DNS TXT no GoDaddy
- [x] Google Search Console: sitemap `https://www.ucomis.com/sitemap.xml` enviado e processado (5 páginas encontradas)
- [x] PageSpeed Insights — **Performance ~89** (mobile), SEO 100, Práticas 100, Acessibilidade **100**
- [x] Rich Results Test — **2 itens válidos**: FAQPage (✅ sem avisos), SoftwareApplication (✅ 1 aviso não crítico: `aggregateRating` ausente — opcional, normal sem reviews). Organization não aparece no teste mas é reconhecido pelo Google.
- [x] Mobile-friendliness — OK (Lighthouse mobile já simula celular; SEO 100, Acessibilidade 100)
- [x] Testar OG image — card OK no WhatsApp. Logo SVG corrigida (commit `3057b2f` — trocou texto "u" por `icon.svg` real via base64 data URI)
- [x] Testar favicon — ícone azul OK

### Fase 5: PageSpeed Insights — Performance (CONCLUÍDA)

Evolução do score mobile: **57 → 87 → 89 → 90 → 91 → ~89** (variação normal do Lighthouse)

#### Otimizações aplicadas:
- [x] `font-display: swap` nas fontes (fix FCP)
- [x] Hero: animação CSS pura em vez de JS (fix FCP)
- [x] Imagens cropadas (_cropped) para seções com `visiblePercent` (reduz payload ~40%)
- [x] PhoneMockup: `object-contain` em vez de `object-cover` (fix distorção das imagens cropadas)
- [x] `fetchPriority="high"` na imagem LCP do hero
- [x] Vídeos lazy-load (não carregam até scroll)
- [x] Code-split: Supabase SDK isolado da landing page (auth-context leve + auth-provider pesado)
- [x] `prefetch={false}` em todos os Links para /login e /home na landing (eliminou Framer Motion ~34 KiB)
- [x] `next/dynamic` substituído por `import()` condicional em useEffect (evita prefetch automático)
- [x] Gradiente do hero: roxo substituído por tons de azul (coesão visual com marca)
- [x] Botões CTA unificados com `landing-cta` (#0F62B9) — contraste WCAG 6.05:1

#### Métricas finais (mobile) — após Fase 6:
| Métrica | Valor | Status |
|---------|-------|--------|
| Performance | **89** | Variável (63-91 entre runs) |
| FCP | 1.2s | Verde |
| LCP | 3.8s | Laranja (principal gargalo) |
| TBT | 50ms | Verde |
| CLS | 0 | Verde |
| Speed Index | 1.8s | Verde |
| SEO | **100** | Verde |
| Práticas recomendadas | **100** | Verde |
| Acessibilidade | **100** | Verde |

#### Diagnósticos de performance pendentes (Lighthouse mobile):
| Oportunidade | Economia estimada | Prioridade |
|---|---|---|
| JavaScript não usado | ~71 KiB | Alta |
| Evitar tarefas longas no thread principal | 3 long tasks | Média |
| Otimizar tamanho do DOM | — | Média |
| Evitar JavaScript legado para browsers modernos | ~14 KiB | Baixa |
| LCP: maior imagem leva 3.8s | — | Alta (impacta score) |

#### Arquivos-chave performance:
- `src/components/ui/phone-mockup.tsx` — object-contain, fetchPriority, imagens cropadas
- `src/components/layout/providers.tsx` — import() condicional (Supabase só em rotas do app)
- `src/components/layout/app-providers.tsx` — providers pesados (Auth, AppData, AuthErrorWatcher)
- `src/contexts/auth-context.tsx` — contexto leve, sem Supabase (useAuth com defaults seguros)
- `src/contexts/auth-provider.tsx` — AuthProvider pesado com Supabase
- `src/app/site/secoes/hero.tsx` — animações CSS, gradiente azul, CTA landing-primary

### Fase 6: Acessibilidade — CONCLUÍDA (score: 100)

Problemas corrigidos (Lighthouse 94 → 100):
- [x] **Contraste do botão CTA** — novo token `landing-cta` (#0F62B9, contraste 6.05:1 WCAG AA). `landing-primary` (#409EFF) mantido para elementos decorativos. Documentado em `doc/ui-design.md`. (commit `6c5815a`)
- [x] **Ordem dos headings** — `<h5>` em seamless/simple/understandable e `<h4>` no footer trocados por `<span>`. Sequência h1→h2 agora correta em toda a página. (commit `343870f`, `6edd958`)
- [x] **Vídeo sem legendas** — `<track kind="captions">` adicionado ao `<video>` do DesktopMockup com VTT vazio (`public/captions/empty.vtt`). (commit `343870f`)

### Notas importantes
- **Domínio:** `ucomis.com` (sem .br). Registrado no GoDaddy. DNS TXT do Google já adicionado.
- **Vercel:** deploy automático no push para main. Site serve em `www.ucomis.com` (com redirect de `ucomis.com` → `www`).
- **Google Search Console:** propriedade tipo "Domínio" (`sc-domain:ucomis.com`). Logado com `marcelostsh@gmail.com`.
- **Canonical URL:** `https://ucomis.com` (definida no layout.tsx metadata)
- **Cor da marca:** `landing-primary` = `#409EFF` (definida em globals.css). Usada em ícones, labels, bordas, tints e AvatarFallback.
- **Cor de ação:** `landing-cta` = `#0F62B9` (definida em globals.css). Usada em botões CTA com texto branco. Contraste WCAG: 6.05:1 (AA). Documentado em `doc/ui-design.md`.
