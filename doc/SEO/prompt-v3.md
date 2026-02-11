# Prompt para Deep Research v3 - Complemento final

Cole este prompt em uma NOVA pesquisa do Google Gemini Deep Research.

---

## PROMPT:

Já fiz duas rodadas de pesquisa de SEO para o produto uComis (SaaS brasileiro para vendedores comissionados controlarem suas próprias comissões). Preciso que você complemente o que ficou faltando. Vou ser específico sobre o que preciso.

### Contexto rápido do produto (NÃO invente funcionalidades):
App web onde o vendedor cadastra suas vendas, define regras de comissão do fornecedor, e o sistema calcula automaticamente quanto ele vai receber e quando (parcelas 30/60/90 dias). Dashboard consolidado. Timeline de recebíveis.

Dois perfis de usuário:
- **Mono-pasta:** trabalha com UMA empresa, não sabe quanto vai receber até cair na conta
- **Multi-pasta:** trabalha com VÁRIAS empresas, precisa consolidar tudo

---

### TAREFA 1: Keywords primárias que faltaram

Nas pesquisas anteriores, os seguintes termos NÃO foram analisados. Preciso de uma tabela com volume mensal estimado (Brasil), KD, CPC (R$) e intenção para CADA UM destes:

- auditoria de comissões
- conferir comissão
- quanto vou receber de comissão
- previsão de comissão
- comissão representante comercial
- sistema para representante comercial
- como saber se minha comissão está certa
- controle de comissões pessoal
- conferir pagamento de comissão
- simulador de comissão de vendas
- comissão de vendas app
- recebíveis de comissão

Formato obrigatório:
| Palavra-chave | Volume Mensal (Est.) | KD | CPC (R$) | Intenção | Perfil (mono/multi/ambos) |

A última coluna é NOVA: indique se o termo é mais buscado pelo vendedor mono-pasta, multi-pasta, ou ambos.

---

### TAREFA 2: Segmentação mono-pasta vs multi-pasta

Faça uma análise separada dos dois perfis:

**Mono-pasta (maioria do mercado):**
- Liste 10 termos que esse vendedor pesquisa no Google
- Ele NÃO busca "multi-pasta" nem "várias representadas"
- Ele busca coisas como: "quanto vou ganhar", "conferir comissão da empresa", "calcular minha comissão", "será que estou recebendo certo"
- Formato tabela com volume, KD, CPC

**Multi-pasta:**
- Liste 10 termos específicos desse perfil
- Ele busca: "consolidar comissões", "várias representadas", "controle de pastas"
- Formato tabela com volume, KD, CPC

---

### TAREFA 3: LSI - Categorias faltantes

Nas pesquisas anteriores, vieram 3 categorias de LSI (Financeiro, Operacional, Jurídico). Faltaram 2. Entregue em LISTA LIMPA:

**Categoria: Ferramentas que o público usa hoje (e quer substituir)**
Liste todos os termos: Excel, planilha, caderno, WhatsApp, bloco de notas, PDF, email, portal da representada, sistema da fábrica, ERP...

**Categoria: Dores e Problemas do vendedor**
Liste todos os termos: erro de cálculo, estorno indevido, desconto fantasma, comissão errada, falta de transparência, não sabe quanto vai receber, demora no pagamento, conferência manual, retrabalho...

---

### TAREFA 4: Análise de SERP real (TABELA)

Para estes 5 termos, me diga o que aparece HOJE na primeira página do Google Brasil:

1. "planilha de comissão de vendas"
2. "como calcular comissão de vendas"
3. "app para controle de vendas"
4. "controle de comissões"
5. "sistema para representante comercial"

Formato OBRIGATÓRIO (uma linha por termo):
| Keyword | Quem está no Top 3 (nome do site) | Tipo de conteúdo (blog/ferramenta/vídeo/loja) | SERP Features presentes (PAA, Featured Snippet, Vídeo, Apps, etc.) |

---

### TAREFA 5: Recomendações para landing page

Com base em TUDO que foi pesquisado (incluindo as rodadas anteriores), me diga:

**Meta Title** (até 60 caracteres):
Escreva 3 opções ranqueadas da melhor pra pior.

**Meta Description** (até 155 caracteres):
Escreva 3 opções.

**H1 da página principal:**
Escreva 3 opções. Deve conter a keyword principal e comunicar a dor do vendedor.

**H2s sugeridos (subtítulos das seções):**
Liste 5-7 H2s que a landing page deveria ter, cada um contendo uma keyword secundária ou LSI.

**Termos para CTAs (botões de ação):**
Liste 5 opções de texto para botões, focados em gratificação imediata.

**REGRA:** Use APENAS funcionalidades reais do produto. NÃO invente nomes de features.

---

### REGRAS DE ENTREGA:

1. Cada tarefa é uma seção separada, numerada (Tarefa 1, Tarefa 2, etc.)
2. TABELAS são obrigatórias onde indicado - não substitua por texto corrido
3. Seja específico: nomes de sites reais na SERP, números nas tabelas
4. Se não tiver dados precisos de volume, estime e SINALIZE que é estimativa
5. Priorize Google Brasil (google.com.br)
