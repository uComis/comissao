# Análise da Proposta de Pivot: Personal Revenue Assurance

**Data:** Dezembro/2025  
**Modelo:** Claude (Anthropic)  
**Contexto:** Análise da proposta de pivot estratégico do uComis

---

## 1. Contexto da Análise

### Estado Atual do Sistema

- SaaS B2B focado em empresas/gestores
- Motor de cálculo de comissões via integração CRM (Pipedrive)
- Schema multi-tenant: Organization → Sellers/Rules/Sales/Commissions
- User vinculado obrigatoriamente a Organization

### Proposta de Pivot Analisada

1. Priorizar vendedor autônomo (B2C) antes de empresa (B2B)
2. App mobile pessoal para cadastro/auditoria de vendas
3. Desacoplar User de Organization
4. Criar duas camadas: PersonalSale (privado) vs CorporateCommission (empresa)
5. Fase posterior: "Match" entre vendedor e empresa

---

## 2. Parecer: FAVORÁVEL ao Pivot

A pesquisa de validação apresentada muda substancialmente o contexto estratégico. **Concordo com o pivot** pelos seguintes motivos:

### 2.1. TAM Comprovado

| Segmento                  | Base de Usuários | Fonte         |
| ------------------------- | ---------------- | ------------- |
| Venda Direta              | 3 milhões        | ABEVD         |
| Representantes Comerciais | 800 mil          | Confere/Cores |
| Varejo CLT                | 1,7 milhões      | RAIS/CAGED    |
| **Total**                 | **~5,5 milhões** | -             |

Comparativo: O modelo B2B original ("PMEs com CRM e +5 vendedores") atinge talvez 50 mil empresas. O TAM do pivot é 100x maior.

### 2.2. Willingness to Pay Validada Empiricamente

- Planilhas de "Controle de Comissões" são vendidas por R$ 19,90 a R$ 119,90 no Mercado Livre
- SuasVendas cobra R$ 89,90/mês no plano Solo
- O fato de usuários pagarem por arquivo estático (.xlsx) comprova disposição a pagar para resolver o problema

Fonte: [Mercado Livre - Planilhas de Comissões](https://lista.mercadolivre.com.br/planilha-para-controle-de-comissoes), [SuasVendas - Preços](https://www.suasvendas.com/precos/sv-rep/)

### 2.3. Dor com Evidência Jurídica

- Litigiosidade documentada no STJ sobre prescrição e pagamento a menor de comissões
- Escritórios de advocacia especializados exclusivamente na defesa de representantes comerciais
- Lei 4.886/65 proíbe cláusulas "del credere", mas a prática mascara descontos indevidos

Fonte: [STJ - Jurisprudência](https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias-antigas/2017/2017-05-23_08-49_Direito-de-representante-comercial-reclamar-comissoes-prescreve-mes-a-mes.aspx)

A dor é real o suficiente para sustentar uma indústria jurídica inteira.

### 2.4. Vácuo Competitivo Real

| Player       | Foco                    | Limitação como Auditor                      |
| ------------ | ----------------------- | ------------------------------------------- |
| Mercos       | Indústria/Distribuidora | Controle da indústria sobre o representante |
| SuasVendas   | Híbrido                 | Exige redigitação de pedidos                |
| Meus Pedidos | Indústria               | Ferramenta de produtividade B2B             |
| Excel        | Controle manual         | Fricção alta, sem automação, abandono       |

Nenhum player atende a necessidade de **auditoria independente e agnóstica** do vendedor. Os sistemas existentes são "Walled Gardens" — mostram apenas dados de uma representada específica.

### 2.5. Go-to-Market Simplificado

| Modelo         | Ciclo de Venda                            | CAC   |
| -------------- | ----------------------------------------- | ----- |
| B2B (empresa)  | Procurement, compliance, decisor múltiplo | Alto  |
| B2C (vendedor) | Download no app store                     | Baixo |

O vendedor individual decide sozinho. Não há comitê de aprovação.

### 2.6. Comportamento "Multi-Pasta" é a Norma

- 80% dos representantes comerciais trabalham com múltiplas pastas
- 40% das consultoras de venda direta atuam com mais de uma marca
- A fragmentação de dados entre 5-6 portais diferentes é estrutural, não excepcional

---

## 3. Correção de Posição Inicial

Na primeira análise (antes de ver a pesquisa), eu tinha objeções:

| Objeção Inicial                                  | Por Que Estava Errado                                               |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| "App de cadastro manual é glorified spreadsheet" | O diferencial é OCR + Open Finance, não cadastro manual             |
| "Monetização B2C é pior"                         | WTP validada empiricamente (planilhas pagas, SuasVendas R$ 89,90)   |
| "Mobile first em 30 dias é inviável"             | PWA resolve sem custo de app nativo                                 |
| "Perde proposta de valor (integração CRM)"       | A nova proposta de valor é diferente e igualmente forte (auditoria) |

---

## 4. O Que Permanece Correto da Análise Inicial

1. **Desacoplar User de Organization** — necessário mesmo no modelo atual
2. **Privacy by Design** — empresa NUNCA pode ver vendas do vendedor para concorrentes
3. **Schema precisa de refatoração** — PersonalSale vs CorporateCommission, Connections N:N
4. **Escopo de 30 dias ainda é agressivo** — precisa priorização cirúrgica

---

## 5. Recomendações de Implementação

### 5.1. Atualizar Documento de Visão (`visao.md`)

**Seção 1 (Tese de Negócio):**

- Adicionar conceito de "Personal Revenue Assurance"
- Empoderar vendedor com "Auditoria de Bolso" independente

**Seção 2 (A Dor Latente):**

- Inserir dor "Limbo do Vendedor Multi-Pastas"
- Vendedores dependem de 5-6 portais diferentes sem visão unificada

**Seção 3 (A Solução):**

- Definir "Double Ledger" (Dupla Checagem):
  - **Modo Auditor (Vendedor):** App pessoal, lançamento manual, projeção de recebíveis
  - **Modo Gestão (Empresa):** SaaS B2B atual, cálculo via CRM

**Seção 4 (Público-Alvo):**

- ICP Primário: Representantes Comerciais Autônomos (RCA) multimarcas
- ICP Secundário: Consultoras de venda direta multi-marca

**Seção 6 (Roadmap):**

- Fase 1: Auditoria Pessoal (Mobile First)
- Fase 2: Integração B2B/Gestor (antigo MVP)
- Fase 3: Match (cruzamento vendedor ↔ empresa)

### 5.2. Refatoração do Schema de Banco

```sql
-- User independente de Organization
-- Pode existir como "Free Agent"

-- Fornecedores pessoais (criados pelo vendedor, sem vínculo Enterprise)
CREATE TABLE personal_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  commission_rules JSONB, -- regras pessoais configuradas
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendas pessoais (dados privados do vendedor)
CREATE TABLE personal_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  supplier_id UUID REFERENCES personal_suppliers,
  client_name TEXT,
  gross_value DECIMAL(15,2),
  net_value DECIMAL(15,2),
  sale_date DATE,
  payment_condition TEXT, -- "30/60/90"
  installments JSONB, -- [{due_date, amount, status, paid_at}]
  source TEXT DEFAULT 'manual', -- 'manual', 'ocr', 'api'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conexões N:N (vendedor ↔ organizações oficiais)
CREATE TABLE user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  organization_id UUID REFERENCES organizations,
  role TEXT DEFAULT 'seller', -- 'seller', 'manager', 'admin'
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'inactive'
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Recebíveis (timeline de pagamentos)
CREATE TABLE receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  personal_sale_id UUID REFERENCES personal_sales,
  supplier_id UUID REFERENCES personal_suppliers,
  due_date DATE NOT NULL,
  expected_amount DECIMAL(15,2),
  received_amount DECIMAL(15,2),
  status TEXT DEFAULT 'pending', -- 'pending', 'received', 'overdue', 'partial'
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3. RLS (Row Level Security) - Privacy by Design

```sql
-- REGRA DE OURO: Organization NUNCA vê personal_sales
CREATE POLICY "Users own their personal_sales"
ON personal_sales FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Users own their personal_suppliers"
ON personal_suppliers FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Users own their receivables"
ON receivables FOR ALL
USING (user_id = auth.uid());

-- Sem exceção para managers de organizações
```

### 5.4. Stack Técnica para MVP

| Camada       | Tecnologia                        | Justificativa                        |
| ------------ | --------------------------------- | ------------------------------------ |
| App          | PWA (Next.js)                     | Mobile-first sem custo de app nativo |
| OCR          | Tesseract.js ou Google Vision API | Leitura de espelhos de pedido        |
| Banco        | Supabase (PostgreSQL)             | Já existe no projeto                 |
| Auth         | Supabase Auth                     | Já existe no projeto                 |
| Open Finance | Belvo/Pluggy (Fase 4+)            | Conciliação bancária automática      |

### 5.5. Roadmap Revisado

| Fase | Nome              | Escopo                                                         | Prazo         |
| ---- | ----------------- | -------------------------------------------------------------- | ------------- |
| 1    | Auditoria Pessoal | Cadastro manual, fornecedores pessoais, timeline de recebíveis | MVP (30 dias) |
| 1.5  | OCR Básico        | Upload de imagem → extração de dados                           | +15 dias      |
| 2    | Portal B2B        | Antigo MVP (empresa/gestor com CRM)                            | +60 dias      |
| 3    | Match             | Cruzamento automático vendedor ↔ empresa                       | +90 dias      |
| 4    | Open Finance      | Conciliação bancária automática                                | +120 dias     |

---

## 6. Riscos e Mitigações

| Risco                         | Probabilidade | Mitigação                                             |
| ----------------------------- | ------------- | ----------------------------------------------------- |
| Escopo em 30 dias             | Alta          | Priorização cirúrgica: só cadastro + timeline         |
| Custo de OCR/APIs             | Média         | Iniciar com Tesseract.js (grátis), API paga só no Pro |
| Adoção por público analógico  | Média         | UX radicalmente simples, linguagem coloquial          |
| Resistência das representadas | Baixa         | Posicionar como "transparência", não litígio          |

---

## 7. Conclusão

A pesquisa de validação apresenta evidências robustas:

1. **TAM de 5,5 milhões de usuários** vs. dezenas de milhares no modelo B2B original
2. **WTP validada** por mercado ativo de planilhas pagas
3. **Dor jurídica documentada** (STJ, escritórios especializados)
4. **Vácuo competitivo** — nenhum player atende auditoria independente do vendedor

O pivot faz sentido estratégico. A execução precisa ser cirúrgica no MVP:

- **Semana 1-2:** Core (cadastro, fornecedores, timeline)
- **Semana 3:** OCR básico
- **Semana 4:** Polish + lançamento beta

Go-to-market: começar com Representantes Comerciais Multimarcas (ticket alto, dor complexa, feedback qualificado) antes de escalar para massa da Venda Direta.

---

## Referências

- [ABEVD - Dados e Informações](https://www.abevd.org.br/dados-e-informacoes/)
- [Confere - Relatório de Gestão 2024](https://www.confere.org.br/wordpress/wp-content/uploads/2025/03/Relatorio-de-gestao.pdf)
- [CNN Brasil - Representante Comercial em Alta](https://www.cnnbrasil.com.br/nacional/por-confere-representante-comercial-uma-profissao-em-alta-no-mercado/)
- [STJ - Jurisprudência Comissões](https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias-antigas/2017/2017-05-23_08-49_Direito-de-representante-comercial-reclamar-comissoes-prescreve-mes-a-mes.aspx)
- [SuasVendas - Preços](https://www.suasvendas.com/precos/sv-rep/)
- [Mercado Livre - Planilhas](https://lista.mercadolivre.com.br/planilha-para-controle-de-comissoes)
