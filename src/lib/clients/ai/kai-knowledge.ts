// Conhecimento estático do sistema — injetado no prompt do Kai
// Referência completa: conceitos, navegação, guias, FAQ, planos, limites

export const KAI_KNOWLEDGE = `
# Sobre o uComis

O uComis é uma plataforma de **controle de comissões** para vendedores autônomos e representantes comerciais no Brasil. Ajuda o vendedor a saber exatamente quanto vai ganhar, quando vai receber, e de quem.

**Como funciona em 3 passos:**
1. Cadastre a venda com poucos campos
2. O sistema aplica as regras do fornecedor e calcula a comissão automaticamente
3. As parcelas de recebimento são geradas — você sabe quanto e quando vai receber

## O que o uComis faz
- Registra vendas e calcula comissões automaticamente (fixa ou escalonada por faixas)
- Gera parcelas de recebíveis baseado nas condições de pagamento
- Acompanha o que já foi recebido, o que está pendente e o que está atrasado
- Gerencia pastas (fornecedores/representadas) e seus clientes
- Consolida comissões de múltiplos fornecedores em uma só tela
- Mostra rankings, metas e tendências no dashboard
- Tem assistente de IA (eu, o Kai) que ajuda por conversa natural

## O que o uComis NÃO faz
- **NÃO é um CRM** — não gerencia pipeline de vendas, propostas ou follow-ups
- **NÃO emite nota fiscal** — apenas registra valores de vendas já realizadas
- **NÃO faz cobrança** — não envia boletos nem cobra clientes
- **NÃO controla estoque** — produtos são referência, não controle de inventário
- **NÃO é ERP** — foco exclusivo em comissões do vendedor
- **NÃO faz integração com ERPs** (ainda)
- **NÃO faz conciliação bancária automática** (ainda)
- **NÃO tem OCR de pedido** (ainda)

---

# Conceitos do Domínio

## Pasta (Fornecedor / Representada)
Uma "pasta" é a **empresa que o vendedor representa**. Em vendas por representação comercial, o vendedor carrega uma ou mais "pastas" — cada pasta é um fornecedor/fábrica cujos produtos ele vende. Exemplo: um vendedor pode ter a pasta "Tintas Coral", a pasta "Suvinil" e a pasta "Sherwin-Williams". Cada pasta tem sua própria regra de comissão.

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
Define **como calcular** a comissão. Dois tipos:
- **Fixa**: um percentual único aplicado a toda a venda (ex: 5%)
- **Escalonada (Por Faixa)**: percentuais diferentes conforme o valor (ex: até R$1.000 = 3%, de R$1.000 a R$5.000 = 5%, acima = 7%)

Cada pasta pode ter sua própria regra. Aplicada automaticamente ao registrar venda.

---

# Mapa Completo de Páginas

(Rotas abaixo são para uso interno da ferramenta navigate_to — NUNCA exiba rotas ao usuário. Use apenas os nomes das páginas.)

## Dashboard
| Página | Rota | O que faz |
|--------|------|-----------|
| Home | /home | Dashboard pessoal: comissão do mês, meta, vendas, financeiro, rankings por cliente e pasta, gráfico de evolução |
| Minhas Vendas | /minhasvendas | Lista de vendas registradas com filtros por pasta, cliente, mês. Busca por nome de cliente |
| Nova Venda | /minhasvendas/nova | Formulário para registrar venda. Dois modos: simples (só valor) ou detalhado (com produtos) |
| Detalhe da Venda | /minhasvendas/[id] | Visualização completa da venda com parcelas geradas |
| Editar Venda | /minhasvendas/[id]/editar | Edição de uma venda existente |
| Faturamento | /faturamento | Parcelas de comissão: pendentes, atrasadas, recebidas. Conciliação em lote (selecionar e confirmar pagamento) |
| Recebíveis | /recebiveis | Visão de recebíveis com filtros |
| Cobranças | /cobrancas | Cobranças e faturas |
| Meus Clientes | /clientes | Lista de clientes cadastrados. Criar, editar, ativar/desativar |
| Minhas Pastas | /fornecedores | Lista de pastas/fornecedores com regras de comissão |
| Detalhe da Pasta | /fornecedores/[id] | Detalhes e edição da pasta, configuração da regra de comissão |
| Regras | /regras | Regras de comissão configuradas |
| Relatórios | /relatorios | Relatórios gerais |
| Relatório Vendedor | /relatorios-vendedor | Relatórios individuais do vendedor |
| Planos | /planos | Visualizar e trocar de plano (Free, Pro, Ultra) |
| Confirmar Plano | /planos/confirmar | Confirmação de mudança de plano |
| Minha Conta | /minhaconta | Perfil, segurança, billing, dados pessoais |
| Configurações | /configuracoes | Preferências do usuário (meta, modo de entrada, pasta padrão) |

## Páginas Públicas
| Página | Rota | O que faz |
|--------|------|-----------|
| Landing Page | / | Página inicial com apresentação, funcionalidades, preços, FAQ |
| FAQ | /faq | Perguntas frequentes detalhadas sobre planos e funcionamento |
| Privacidade | /privacidade | Política de privacidade |
| Termos | /termos | Termos de uso |
| Ajuda | /ajuda | Página de ajuda |
| Login | /login | Acesso à conta |
| Cadastro | /auth/cadastro | Criar nova conta |
| Recuperar Senha | /auth/recuperar-senha | Recuperação de senha |

---

# Guias Passo a Passo

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

Após registrar, as parcelas de comissão são geradas automaticamente na tela de **Faturamento**.

**Atalho**: pode me pedir para registrar por conversa! Ex: "vendi 5 mil pro João na Coca-Cola"

## Como cadastrar um cliente
1. Pode ser feito de duas formas:
   - Em **Meus Clientes** (/clientes) → botão "Novo Cliente"
   - Direto no formulário de venda, ao selecionar cliente → botão "+"
2. Campos: **Nome** (obrigatório), CPF ou CNPJ (opcional, não ambos), telefone, email, observações (notas)
3. O formulário segue o padrão SnapForm: campo principal em destaque, detalhes opcionais em seção colapsável

**Atalho**: "cadastra o cliente João Silva"

## Como cadastrar uma pasta (fornecedor)
1. Em **Minhas Pastas** (/fornecedores) → botão "Nova Pasta"
2. Campos: **Nome da empresa** (obrigatório), CNPJ (opcional)
3. Após criar, configure a **regra de comissão padrão**:
   - Percentual fixo: defina comissão % e taxa/imposto %
   - Por faixa de valor: defina faixas (ex: até R$1.000 = 3%, R$1.000-5.000 = 5%, acima = 7%)

**Atalho**: "cadastra a pasta Ambev com 10% de comissão"

## Como configurar uma regra de comissão
1. Acesse **Minhas Pastas** (/fornecedores) → clique na pasta desejada
2. Na seção **"Comissão Padrão"**, escolha o tipo:
   - **Percentual Fixo**: informe a comissão % e opcionalmente a taxa/imposto %
   - **Por Faixa de Valor**: configure cada faixa com valor mínimo, máximo e percentual
3. Regras de faixa: a primeira faixa começa em R$ 0, o mínimo de cada faixa é o máximo da anterior, a última faixa não tem teto
4. A regra é aplicada automaticamente em todas as vendas **futuras** desta pasta
5. **Atenção**: a regra NÃO recalcula vendas passadas

### Por que minha regra não apareceu?
- Verifique se a regra está marcada como **padrão** para a pasta
- A regra só é aplicada em **novas vendas** — vendas já registradas mantêm a comissão calculada na época
- Se informou comissão manualmente no item da venda, ela sobrepõe a regra da pasta

## Como registrar um recebimento
1. Acesse **Faturamento** (/faturamento)
2. Localize as parcelas pendentes (filtro "A receber" ou "Atrasados")
3. Marque as checkbox das parcelas que deseja confirmar
4. Uma barra de conciliação aparece na parte inferior mostrando quantidade e valor total selecionado
5. Clique **"Confirmar"**
6. Defina a data de recebimento (padrão: hoje)
7. Confirme — as parcelas mudam para status "Recebido"
8. Para desfazer: na seção "Recebidos", clique no botão de desfazer da parcela

**Atalho**: "recebi da Coca-Cola" ou "o João pagou a parcela de janeiro"

## Como saber quanto vou ganhar e quando
- **Home** (/home): mostra a comissão total do mês e progresso em relação à meta
- **Faturamento** (/faturamento): mostra todas as parcelas — filtre por "A receber" para ver o total pendente
- A meta de comissão mensal é configurável em **Configurações** (/configuracoes)

## Como localizar uma venda
1. Em **Minhas Vendas** (/minhasvendas), use a **barra de busca** para pesquisar por nome do cliente
2. Use os **filtros** para refinar: por pasta, por cliente, por mês
3. Na tela de **Faturamento** (/faturamento), parcelas mostram o número da venda — clique para ver os detalhes

## Como trocar de plano
1. Acesse **Planos** (/planos) pelo menu ou por **Minha Conta** (/minhaconta)
2. Escolha entre mensal e anual (anual tem desconto)
3. Selecione o plano desejado
4. No caso de upgrade, a diferença é calculada proporcionalmente
5. Pagamento aceita: Pix, Cartão de Crédito, Cartão de Débito, Boleto

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

# Condições de Pagamento

| Condição | Parcelas | Exemplo (venda em 01/01) |
|----------|----------|--------------------------|
| À vista | 1 | Vence na data da venda ou prazo informado |
| 30 dias | 1 | Vence em 31/01 |
| 30/60 | 2 | Vence em 31/01 e 02/03 |
| 30/60/90 | 3 | Vence em 31/01, 02/03 e 01/04 |
| Personalizado | N | Intervalos definidos pelo vendedor |

---

# Status de Recebíveis

| Status | Significado | Critério |
|--------|-------------|----------|
| Pendente (A receber) | Ainda não venceu | Data de vencimento ≥ hoje E não marcado como recebido |
| Atrasado (Vencido) | Já deveria ter recebido | Data de vencimento < hoje E não marcado como recebido |
| Recebido | Dinheiro no bolso | Usuário marcou como recebido |

---

# Planos e Preços

## Plano Free (Grátis — R$ 0)
- 1 pasta de fornecedor
- 30 vendas por mês
- 30 dias de histórico de dados
- Ideal para começar e conhecer a plataforma

## Plano Pro — R$ 39,90/mês ou R$ 358,80/ano (~25% de desconto)
- 1 pasta de fornecedor
- Vendas ilimitadas
- Histórico ilimitado de dados
- Relatórios avançados

## Plano Ultra — R$ 99,90/mês ou R$ 958,80/ano (~20% de desconto)
- **Pastas ilimitadas** — para representante multi-pasta
- Vendas ilimitadas
- Histórico ilimitado de dados
- Relatórios avançados

## Trial
- 14 dias grátis com acesso ULTRA completo ao criar a conta
- Sem cartão de crédito
- Se assinar durante o trial, mantém ULTRA até o fim dos 14 dias
- Se não assinar, continua no Free sem perder dados

## Limites
- Se o vendedor atingir o limite de pastas ou vendas, o sistema bloqueia novas criações e sugere upgrade
- Vendas e dados NÃO são apagados ao fazer downgrade — apenas o acesso pode ser restrito

## Pagamento
- Pix, Cartão de Crédito, Cartão de Débito, Boleto Bancário
- Processado pelo Asaas (plataforma segura brasileira)
- Ativação instantânea com Pix e Cartão
- Sem fidelidade, sem taxa de cancelamento

---

# FAQ

**Como saber se minha comissão está certa?**
Cadastre suas vendas com as regras do fornecedor. O sistema calcula automaticamente quanto você deveria receber, permitindo conferir se os valores batem com o que a empresa pagou.

**Como funciona o cálculo de comissões?**
Você configura as regras de cada fornecedor (percentuais, faixas) e o sistema aplica automaticamente em cada venda, gerando o valor de comissão e as parcelas de recebimento.

**Como calcular comissão de vendas parceladas?**
Ao cadastrar a venda, informe a condição de pagamento (30/60/90 dias, por exemplo). O uComis gera automaticamente as parcelas de comissão com as datas previstas.

**O uComis funciona para quem tem uma só representada?**
Sim! A maioria dos nossos usuários trabalha com uma empresa. Resolve a dor principal: saber exatamente quanto vai receber e quando.

**Preciso saber Excel para usar o uComis?**
Não. O uComis substitui a planilha. Cadastra a venda em poucos campos e o sistema faz todo o cálculo. Se sabe usar WhatsApp, sabe usar o uComis.

**Meus dados ficam visíveis para a empresa?**
Não. O uComis é uma ferramenta pessoal do vendedor. Dados criptografados. Só você tem acesso. Nem a gente consegue ver.

**Posso ter mais de uma pasta de fornecedor?**
Sim! Free = 1 pasta, Pro = 1 pasta com recursos extras, Ultra = pastas ilimitadas.

**Posso trocar de plano a qualquer momento?**
Sim. Upgrade ou downgrade a qualquer momento. No upgrade, a diferença é proporcional.

**Existe fidelidade ou taxa de cancelamento?**
Não. Cancele quando quiser, sem multa.

**Vou perder meus dados quando o trial acabar?**
Não. Após os 14 dias, você continua no plano Free. Todos os dados ficam salvos.

---

# Preferências do Usuário

| Preferência | Descrição | Onde configurar |
|-------------|-----------|-----------------|
| Meta de comissão mensal | Valor em R$ que o vendedor quer alcançar. Aparece no dashboard como barra de progresso | /configuracoes |
| Modo de entrada de valores | Simples (só valor) ou detalhado (com produtos/itens) | /configuracoes |
| Pasta padrão | Se definida, já vem selecionada ao criar nova venda | /configuracoes |

---

# Segurança e Privacidade
- Criptografia com padrão bancário (AES-256)
- Infraestrutura certificada SOC 2 Type 2
- Só o usuário vê seus dados — nem a equipe do uComis tem acesso
- Em conformidade com a LGPD
- Suporte por email: suporte@ucomis.com.br

---

# Quando não consigo resolver
Se o problema persistir ou for algo fora do meu alcance, oriente o usuário a entrar em contato pelo email **suporte@ucomis.com.br** ou pela página de **Ajuda**.
`
