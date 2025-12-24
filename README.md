# uComiss

Motor de cálculo de comissões para PMEs. Conecta ao CRM, aplica regras configuráveis, elimina planilhas.

## O Problema

O fechamento de comissões em PMEs é um processo caótico:

- **Financeiro/RH:** Extrai dados do CRM manualmente, joga em planilhas de 47 abas, gasta dias calculando. Erros frequentes.
- **Vendedor:** Não sabe quanto vai receber até o dia do pagamento. Desconfiança, desmotivação, disputas.
- **Empresa:** Conforme o time cresce, a planilha vira um monstro inauditável.

## A Solução

Um middleware que conecta ao CRM (Pipedrive), lê as vendas automaticamente, aplica as regras de comissão configuradas e entrega o valor exato a pagar.

**Elimina a planilha. Elimina o erro humano. Elimina a desconfiança.**

## Para Quem

- PMEs B2B que já usam CRM estruturado
- Equipes comerciais acima de 5 vendedores
- Gestores que perdem dias todo mês fechando comissões

## Funcionalidades (MVP)

- Integração com Pipedrive (leitura de vendas)
- Motor de regras configurável (% fixa, faixas escalonadas)
- Painel administrativo para o gestor
- Relatórios de fechamento em PDF/CSV

## Roadmap

| Fase        | Foco        | Entrega                                  |
| ----------- | ----------- | ---------------------------------------- |
| **1 - MVP** | Gestor      | Calculadora automática, elimina planilha |
| **2**       | Vendedor    | Acesso individual, extrato de comissões  |
| **3**       | Engajamento | Gamificação, metas visuais, simuladores  |
| **4**       | Automação   | Workflows via chat com IA                |
| **5**       | Fiscal      | Integração com ERPs, dedução de impostos |

## Documentação

| Documento                                         | Descrição                                                   |
| ------------------------------------------------- | ----------------------------------------------------------- |
| [Visão do Produto](doc/visao.md)                  | Vision Board, problema, solução, ICP, roadmap completo      |
| [Contexto e Objetivo](doc/contexto_e_objetivo.md) | Decisão estratégica, análise de ideias, MVP 30 dias         |
| [Modelo de Dados](doc/database.md)                | Diagrama do banco, tabelas, relacionamentos                 |
| [Arquitetura](doc/arquitetura.md)                 | Stack técnica, estrutura de pastas, padrões, fluxo de dados |

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
