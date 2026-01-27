# uComis

Auditoria de comissões para vendedores autônomos. Consolida múltiplas "pastas", calcula recebíveis, elimina planilhas.

## O Problema

O vendedor multi-pastas vive no caos:

- **5 portais diferentes:** Cada representada tem seu sistema (Mercos, SuasVendas, PDFs por email). Nenhum fala com o outro.
- **Conferência manual:** Para saber "quanto vou receber?", precisa baixar 5 relatórios, somar, descontar impostos, rastrear parcelas.
- **Caixa preta:** Erros de cálculo, estornos indevidos e descontos fantasmas são comuns. Sem ferramenta para auditar.

## A Solução

Uma plataforma pessoal onde o vendedor cadastra suas pastas (representadas), lança vendas e acompanha recebíveis em um só lugar.

**Sua receita. Seu controle. Sua auditoria.**

## Para Quem:

- Representantes comerciais autônomos (multi-pastas)
- Consultoras de venda direta (Natura, Avon, etc.)
- Qualquer vendedor comissionado que quer controle sobre sua receita
- *(Futuro)* Empresas que querem gerenciar comissões dos seus vendedores

## Modos de Uso

| Modo | Descrição | Status |
| ---- | --------- | ------ |
| **Vendedor** | O vendedor cadastra suas vendas e acompanha suas comissões/recebíveis | Ativo |
| **Empresa** | A empresa cadastra e gerencia as comissões dos seus vendedores | Desabilitado |

> **Foco atual:** 100% no Modo Vendedor. O Modo Empresa será implementado após a conclusão da Fase 1.

## Funcionalidades (Fase Atual)

- Cadastro de fornecedores pessoais com regras de comissão
- Lançamento de vendas com itens e condição de pagamento
- Geração automática de parcelas (30/60/90)
- Timeline de recebíveis: "quanto vou receber e quando"
- Dashboard consolidado por fornecedor

## Roadmap

| Fase    | Foco          | Entrega                                   | Status       |
| ------- | ------------- | ----------------------------------------- | ------------ |
| **1**   | Vendedor      | Auditoria pessoal, recebíveis, dashboard  | Em andamento |
| **1.5** | OCR           | Foto do pedido → lançamento automático    | Pendente     |
| **2**   | Empresa (B2B) | Portal gestor, integração CRM, relatórios | Pendente     |
| **3**   | Match         | Cruzamento vendedor ↔ empresa             | Pendente     |
| **4**   | Open Finance  | Conferência automática de depósitos       | Pendente     |

## Documentação

| Documento                                         | Descrição                                              |
| ------------------------------------------------- | ------------------------------------------------------ |
| [Visão do Produto](doc/visao-v2.md)               | Vision Board, problema, solução, ICP, roadmap completo |
| [Decisão Estratégica](doc/decisao-estrategica.md) | Análise de ideias, escolha do produto, MVP 30 dias     |
| [Modelo de Dados](doc/database.md)                | Diagrama do banco, tabelas, relacionamentos            |
| [Arquitetura](doc/arquitetura.md)                 | Stack técnica, estrutura de pastas, padrões            |

## Tech Stack

| Camada    | Tecnologia                          |
| --------- | ----------------------------------- |
| Framework | Next.js 15 + React 19 + TypeScript  |
| Banco     | Supabase (PostgreSQL)               |
| Auth      | Supabase Auth (Google + Magic Link) |
| UI        | Tailwind CSS + shadcn/ui            |
| Validação | Zod                                 |
| Cálculos  | decimal.js                          |
| Gráficos  | Recharts                            |

## Setup

_(em definição)_
