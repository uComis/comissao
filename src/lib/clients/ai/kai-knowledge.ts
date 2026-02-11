// Conhecimento estático do sistema — injetado no prompt do Kai
// Manter conciso: cada seção é referência, não manual exaustivo

export const KAI_KNOWLEDGE = `
# Sobre o uComis

O uComis é uma plataforma de **controle de comissões** para vendedores autônomos e representantes comerciais no Brasil. Ajuda o vendedor a saber exatamente quanto vai ganhar, quando vai receber, e de quem.

## O que o uComis faz
- Registra vendas e calcula comissões automaticamente
- Gera parcelas de recebíveis baseado nas condições de pagamento
- Acompanha o que já foi recebido, o que está pendente e o que está atrasado
- Gerencia pastas (fornecedores/representadas) e seus clientes
- Permite configurar regras de comissão por pasta (fixa ou escalonada)
- Mostra rankings, metas e tendências no dashboard

## O que o uComis NÃO faz
- **NÃO é um CRM** — não gerencia pipeline de vendas, propostas ou follow-ups
- **NÃO emite nota fiscal** — apenas registra valores de vendas já realizadas
- **NÃO faz cobrança** — não envia boletos nem cobra clientes
- **NÃO controla estoque** — produtos são referência, não controle de inventário
- **NÃO é ERP** — foco exclusivo em comissões do vendedor

---

# Conceitos do Domínio

## Pasta (Fornecedor / Representada)
Uma "pasta" é a **empresa que o vendedor representa**. Em vendas por representação comercial, o vendedor carrega uma ou mais "pastas" — cada pasta é um fornecedor/fábrica cujos produtos ele vende. Exemplo: um vendedor pode ter a pasta "Tintas Coral", a pasta "Suvinil" e a pasta "Sherwin-Williams". Cada pasta pode ter sua própria regra de comissão.

No uComis, o menu mostra como **"Minhas Pastas"**. É equivalente a "fornecedor" ou "representada".

## Cliente
É a pessoa ou empresa **para quem** o vendedor vende. Exemplo: "Loja do João", "Construtora ABC". O vendedor cadastra seus clientes e associa vendas a eles.

## Venda
Um registro de venda realizada. Contém: pasta (de quem), cliente (pra quem), valor bruto, taxa/imposto, comissão calculada, data, condição de pagamento, e opcionalmente itens detalhados (produtos, quantidades, preços unitários).

## Recebível (Parcela)
Cada venda gera uma ou mais **parcelas de comissão** a receber. Se a venda é à vista, gera 1 parcela. Se é parcelada em 30/60/90, gera 3 parcelas com datas de vencimento calculadas. Cada parcela tem um status:
- **Pendente (A receber)**: a data de vencimento ainda não chegou
- **Atrasado (Vencido)**: a data de vencimento já passou e o vendedor não marcou como recebido
- **Recebido**: o vendedor confirmou que recebeu aquele valor

## Regra de Comissão
Define **como calcular** a comissão de uma venda. Existem dois tipos:
- **Fixa**: um percentual único aplicado a toda a venda (ex: 5% de comissão)
- **Escalonada (Por Faixa)**: percentuais diferentes conforme o valor da venda

Cada pasta pode ter sua própria regra. A regra é aplicada automaticamente ao registrar uma venda.

---

# Menus e Navegação

## Modo Pessoal (vendedor autônomo)
Este é o modo principal. Menus disponíveis:

| Menu | Caminho | O que faz |
|------|---------|-----------|
| Home | /home | Dashboard com KPIs: comissão do mês, vendas, financeiro, rankings |
| Minhas Vendas | /minhasvendas | Lista de vendas registradas, filtros por pasta/cliente/mês |
| Nova Venda | /minhasvendas/nova | Formulário para registrar uma venda |
| Faturamento | /faturamento | Parcelas de comissão: pendentes, atrasadas, recebidas — com ações de conciliação |
| Meus Clientes | /clientes | Lista de clientes cadastrados |
| Minhas Pastas | /fornecedores | Lista de pastas (fornecedores) com regras de comissão |

O menu de **Faturamento** é onde o vendedor acompanha seu fluxo de caixa — é a tela principal para ver o que vai receber e quando.

## Modo Organizacional (futuro)
Para empresas que gerenciam equipes de vendedores. Terá: Dashboard, Vendedores, Regras, Vendas, Configurações.
Hoje o uComis opera exclusivamente no modo pessoal.

---

# Como Fazer

## Como registrar uma venda
1. Acesse **Minhas Vendas** → botão **"Nova Venda"** (ou ícone "+" no menu mobile)
2. **Identificação**: selecione a Pasta (fornecedor) e o Cliente. Se não existirem, crie na hora usando o botão "+"
3. **Valores**: adicione os valores da venda. Há dois modos:
   - **Modo simples**: insira apenas o valor bruto, taxa e comissão
   - **Modo detalhado**: insira produtos com quantidade × preço unitário
   A comissão é calculada automaticamente pela regra da pasta, mas pode ser ajustada manualmente por item
4. **Pagamento**: escolha "À Vista" ou "Parcelado"
   - À vista: defina a data e o prazo em dias
   - Parcelado: defina o cronograma (ex: "30/60/90") — o sistema sugere padrões comuns
5. **Observações** (opcional): notas livres sobre a venda
6. Clique **"Registrar venda"**

Após registrar, as parcelas de comissão são geradas automaticamente na tela de Faturamento.

## Como cadastrar um cliente
1. Pode ser feito de duas formas:
   - Em **Meus Clientes** → botão "Novo Cliente"
   - Direto no formulário de venda, ao selecionar cliente → botão "+"
2. Campos: **Nome** (obrigatório), CPF ou CNPJ (opcional, não ambos), telefone, email, observações
3. O formulário segue o padrão SnapForm: campo principal em destaque, detalhes opcionais em seção colapsável

## Como cadastrar uma pasta (fornecedor)
1. Em **Minhas Pastas** → botão "Nova Pasta"
2. Campos: **Nome da empresa** (obrigatório), CNPJ (opcional)
3. Após criar, configure a **regra de comissão padrão**:
   - Percentual fixo: defina comissão % e taxa/imposto %
   - Por faixa de valor: defina faixas (ex: até R$1.000 = 3%, de R$1.000 a R$5.000 = 5%, acima de R$5.000 = 7%)

## Como configurar uma regra de comissão
1. Acesse **Minhas Pastas** → clique na pasta desejada
2. Na seção **"Comissão Padrão"**, escolha o tipo:
   - **Percentual Fixo**: informe a comissão % e opcionalmente a taxa/imposto %
   - **Por Faixa de Valor**: configure cada faixa com valor mínimo, máximo e percentual
3. Regras de faixa: a primeira faixa começa em R$ 0, o mínimo de cada faixa é o máximo da anterior, a última faixa não tem teto (ilimitada)
4. A regra é aplicada automaticamente em todas as vendas futuras desta pasta
5. **Atenção**: a regra NÃO recalcula vendas passadas. Se mudar a regra, apenas novas vendas usarão a nova regra

### Por que minha regra não apareceu?
- Verifique se a regra está marcada como **padrão** para a pasta
- Ao criar a pasta, a primeira regra é automaticamente marcada como padrão
- A regra só é aplicada em **novas vendas** — vendas já registradas mantêm a comissão calculada na época
- Se informou comissão manualmente no item da venda, ela sobrepõe a regra da pasta

## Como registrar um recebimento
1. Acesse **Faturamento**
2. Localize as parcelas pendentes (filtro "A receber" ou "Atrasados")
3. Marque as checkbox das parcelas que deseja confirmar
4. Uma barra de conciliação aparece na parte inferior mostrando quantidade e valor total selecionado
5. Clique **"Confirmar"**
6. Defina a data de recebimento (padrão: hoje)
7. Confirme — as parcelas mudam para status "Recebido"
8. Para desfazer: na seção "Recebidos", clique no botão de desfazer da parcela

## Como saber quanto vou ganhar e quanto falta
- **Home**: mostra a comissão total do mês e progresso em relação à meta
- **Faturamento**: mostra todas as parcelas — filtre por "A receber" para ver o total pendente
- A meta de comissão mensal é configurável nas preferências do usuário

## Como localizar uma venda
1. Em **Minhas Vendas**, use a **barra de busca** para pesquisar por nome do cliente
2. Use os **filtros** para refinar: por pasta (fornecedor), por cliente, por mês
3. Na tela de **Faturamento**, parcelas mostram o número da venda — clique para ver os detalhes

---

# Regras de Comissão em Detalhe

## Tipo Fixo
Um percentual único aplicado sobre o valor líquido (valor bruto menos impostos).

Exemplo:
- Regra: 5% de comissão, 10% de imposto
- Venda de R$ 10.000
- Imposto: R$ 1.000 (10%)
- Base de cálculo: R$ 9.000
- Comissão: R$ 450 (5% de R$ 9.000)

## Tipo Escalonado (Por Faixa)
Percentuais diferentes por faixa de valor. Cada faixa aplica seu percentual APENAS à porção do valor que cai naquela faixa.

Exemplo:
- Faixa 1: R$ 0 a R$ 1.000 → 3%
- Faixa 2: R$ 1.000 a R$ 5.000 → 5%
- Faixa 3: acima de R$ 5.000 → 7%

Venda de R$ 8.000:
- Faixa 1: R$ 1.000 × 3% = R$ 30
- Faixa 2: R$ 4.000 × 5% = R$ 200
- Faixa 3: R$ 3.000 × 7% = R$ 210
- **Total: R$ 440** (percentual efetivo: 5,5%)

## Hierarquia de Aplicação
1. Se o usuário informou comissão % manualmente no item → usa o valor informado
2. Se não, busca a regra padrão da pasta → calcula automaticamente
3. Se a pasta não tem regra → comissão fica como 0% (o usuário precisa configurar)

---

# Status de Recebíveis

| Status | Significado | Critério |
|--------|-------------|----------|
| Pendente (A receber) | Ainda não venceu | Data de vencimento ≥ hoje E não marcado como recebido |
| Atrasado (Vencido) | Já deveria ter recebido | Data de vencimento < hoje E não marcado como recebido |
| Recebido | Dinheiro no bolso | Usuário marcou como recebido |

A data de vencimento é calculada automaticamente a partir da condição de pagamento da venda. Exemplo: venda em 01/jan com condição "30/60/90" gera parcelas em 31/jan, 02/mar, 01/abr.

---

# Condições de Pagamento

| Condição | Parcelas | Exemplo (venda em 01/01) |
|----------|----------|--------------------------|
| À vista | 1 | Vence na data da venda ou prazo informado |
| 30 dias | 1 | Vence em 31/01 |
| 30/60 | 2 | Vence em 31/01 e 02/03 |
| 30/60/90 | 3 | Vence em 31/01, 02/03 e 01/04 |
| Personalizado | N | Intervalos definidos pelo vendedor |

O campo "Data da 1ª parcela" define quando começa a contagem. As parcelas seguintes são calculadas com o intervalo definido.

---

# Preferências do Usuário

| Preferência | Descrição |
|-------------|-----------|
| Meta de comissão mensal | Valor em R$ que o vendedor quer alcançar no mês. Aparece no dashboard como barra de progresso |
| Modo de entrada de valores | Simples (só valor) ou detalhado (com produtos/itens) — define o padrão ao criar vendas |
| Pasta padrão | Se definida, já vem selecionada ao criar nova venda |

---

# Limites por Plano

O uComis tem planos com limites de uso:
- **Quantidade de pastas (fornecedores)**: planos básicos limitam quantas pastas o vendedor pode ter
- **Quantidade de vendas por mês**: planos limitam registros mensais
- **Retenção de dados**: planos definem por quanto tempo o histórico fica disponível
- Se o vendedor atingir o limite, o sistema bloqueia novas criações e sugere upgrade de plano
`
