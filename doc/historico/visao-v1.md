# ⚠️ DOCUMENTO HISTÓRICO

> **Este documento reflete a estratégia inicial (B2B first) que foi substituída.**
>
> **Para a visão atual, consulte:** [nova-visao.md](../nova-visao.md)
>
> **Motivo do pivot:** Pesquisa de mercado validou TAM maior (5,5M vendedores vs 50K empresas),
> CAC menor (app store vs venda B2B) e vácuo competitivo em auditoria pessoal para vendedores.

---

DOCUMENTO DE VISÃO DO PRODUTO (Vision Board)
Projeto: uComis Data: Dezembro/2025 Responsável: [Seu Nome]

1. A Tese de Negócio (O "Porquê Agora?")
   O mercado de gestão de vendas em Pequenas e Médias Empresas (PMEs) amadureceu digitalmente com a adoção de CRMs modernos (Pipedrive, HubSpot). No entanto, a camada financeira de incentivos e comissões permaneceu presa em processos manuais arcaicos.

A tese é o Unbundling (Desagregação): Retirar o cálculo de comissões de dentro de planilhas frágeis ou ERPs generalistas e tratá-lo com a profundidade necessária, oferecendo automação, auditoria e, futuramente, conformidade tributária total em um cenário de mudanças fiscais iminentes no Brasil.

2. A Dor Latente (O Problema)
   O processo atual é desconectado e gera atrito entre os departamentos Financeiro e Comercial:

O Caos Operacional (Financeiro/RH): O fechamento da folha de pagamento exige a extração manual de dados do CRM para planilhas complexas ("Excel de 47 abas"). Isso consome dias de trabalho qualificado e gera erros de cálculo frequentes.

A Caixa Preta (Vendas): O vendedor não tem clareza sobre suas regras de remuneração ou quanto receberá até o momento do pagamento, gerando desconfiança, disputas trabalhistas e desmotivação.

O Risco de Escala: Conforme a equipe cresce e as regras ficam complexas (bônus, metas escalonadas), a planilha se torna insustentável e inauditável.

3. A Solução (O Conceito do Produto)
   Um Motor de Cálculo de Comissões (Middleware) automatizado que se conecta diretamente ao CRM da empresa.

O sistema atua como um "auditor robô": monitora as vendas fechadas em tempo real, aplica as regras de negócio configuradas pela empresa (percentuais, faixas, descontos) e entrega o valor exato a ser pago, sem intervenção manual.

Proposta de Valor Central:

Conexão Direta: Elimina o "Ctrl+C / Ctrl+V" do CRM para o Excel.

Transparência: Transforma regras complexas em matemática exata.

Flexibilidade: Permite configurar regras que o Excel não suporta bem (recorrência, splits, deduções).

4. O Público-Alvo (ICP)
   Perfil: Pequenas e Médias Empresas (PMEs) B2B.

Maturidade Digital: Já utilizam CRM estruturado (foco inicial em usuários de Pipedrive).

Dores Específicas: Equipes comerciais acima de 5 vendedores, onde o cálculo manual já se tornou um gargalo de tempo para o gestor.

5. Diferencial Competitivo
   Vs. Excel: Automação, redução de erro humano e histórico auditável.

Vs. Módulos de CRM (Salesforce/HubSpot): Foco na realidade brasileira, facilidade de configuração e custo acessível para PMEs (sem necessidade de consultoria de implantação).

Vs. Softwares Enterprise (Spiff/CaptivateIQ): Simplicidade "Self-Service". O cliente conecta e usa, sem projetos de meses.

6. Roadmap de Execução (Estratégia de Lançamento)
   A estratégia foca em resolver a dor do Gestor primeiro (quem compra), para depois encantar o Vendedor (quem usa), e por fim blindar a empresa (Fiscal).

Fase 1: O MVP "Calculadora Automática" (Escopo Mês 1)
Foco: Resolver a dor do Financeiro/Gestor.

Funcionalidade:

Integração unilateral com CRM (Leitura de Vendas).

Motor de Regras Configurável (Ex: % fixa, % por meta).

Taxa de Dedução Simplificada (Taxa Mágica): Campo para configurar % de imposto estimado a ser descontado antes do cálculo da comissão.

Lógica de Estorno (Clawback): Cancelamento automático da comissão se a venda voltar para status "Perdido" no CRM.

Painel Administrativo único (Acesso apenas para o Gestor).

Relatórios de fechamento em PDF/CSV (Para o Gestor enviar ao RH e aos vendedores).

Objetivo: Eliminar o uso da planilha do gestor.

Fase 2: Transparência (Acesso do Time)
Foco: Resolver a desconfiança do Vendedor.

Funcionalidade:

Login individual ou Link Seguro para cada vendedor.

Dashboard pessoal: "Extrato de Comissões" (O vendedor vê suas próprias vendas e quanto geraram).

Objetivo: Eliminar as perguntas "quanto vou receber?" no WhatsApp do gestor.

Fase 3: Gestão de Margem e Lucratividade (Granularidade por SKU)
Foco: Transformar a comissão em ferramenta estratégica para proteger margem.

O Problema: Vendedores tendem a vender o que é mais fácil (produtos baratos ou com muito desconto) apenas para bater meta de volume, destruindo a margem da empresa. Planilhas e CRMs nativos falham em calcular regras mistas dentro do mesmo pedido.

Funcionalidade:

Sincronização de Catálogo: Importa automaticamente Produtos/Serviços do CRM ou ERP (SKU, Nome, Categoria, Preço Base).

Motor de Regras "Line-Item": O sistema "explode" o pedido em itens individuais antes de calcular. Ex: Em um contrato de R$ 10.000, aplica 10% sobre "Consultoria" (R$ 5k) e 2% sobre "Hardware" (R$ 5k).

Hierarquia de Incentivos: Regra de Produto (Específica) > Regra de Categoria > Regra Geral do Vendedor. Permite criar campanhas relâmpago sem quebrar regras existentes.

Trava de Desconto (Margem Dinâmica): A comissão varia conforme o desconto dado. Ex: "Comissão é 5%. Se desconto > 10%, comissão cai para 2%." O vendedor sente no bolso quando dá desconto desnecessário.

Campanhas Sazonais (Incentive Campaigns): Regras com período de validade (`start_date` e `end_date`). Ex: "De 25/11 a 30/11 (Black Friday), comissão = 10% em vez de 5%". O sistema aplica automaticamente baseado na data da venda. Permite empilhar com regras de produto: "Black Friday + Produto X = 15%". Elimina a conferência manual linha por linha no Excel.

Impacto: O gestor deixa de pagar por "volume burro" e passa a pagar por "lucro líquido". O CFO entende em 30 segundos. Justifica ticket premium.

Fase 4: Comissão Recorrente com Vesting (Parcelamento Condicional)
Foco: Atender modelos de negócio SaaS, Seguros, Consórcios e Telecom.

O Problema: Em vendas recorrentes (assinaturas anuais, apólices), pagar 100% da comissão no ato da venda é arriscado. Se o cliente cancelar no mês 2, a empresa já pagou comissão sobre receita que não existirá. Planilhas não conseguem agendar e condicionar pagamentos futuros.

Funcionalidade:

Comissão Parcelada: Vendedor fecha contrato anual de R$ 12.000, mas recebe a comissão diluída. Ex: "50% das 3 primeiras mensalidades".

Gatilho de Pagamento (Trava de Caixa): Configuração flexível de liberação:

- Modo Venda (Competência): Paga 100% no fechamento do negócio (Risco da Empresa).
- Modo Faturamento (Caixa): A comissão só é liberada após a confirmação do pagamento da fatura pelo cliente. Se o cliente atrasar, a comissão trava. Se não pagar, a comissão não existe.

Agendamento Automático: Sistema cria registros de comissão com status `futuro` no momento da venda. Todo mês processa automaticamente.

Condicional ao Pagamento (Clawback): Comissão só é liberada se o cliente pagou. Se cliente cancelar ou ficar inadimplente, parcelas futuras são canceladas automaticamente.

Ledger/Conta Corrente: Histórico completo de créditos e débitos por vendedor. Transparência total.

Impacto: Funcionalidade de "lock-in" — empresa que usa comissão parcelada em 12x (comum em seguros) não pode cancelar o software sem perder controle de pagamentos futuros. Atrai clientes de ticket alto (Seguradoras, SaaS B2B). Usar linguagem de Competência vs Caixa eleva o produto de "calculadora de vendedor" para "ferramenta de gestão financeira".

Fase 5: Engajamento (Gamificação)
Foco: Aumentar a performance de vendas.

Funcionalidade:

Barras de progresso e metas visuais.

Simuladores ("Se eu vender mais X, ganho quanto?").

Notificações de conquista em tempo real.

Fase 6: O "Vilão Tributário" & Integrações
Foco: Precisão Fiscal e Compliance (Split Payment).

Funcionalidade:

Integração com ERPs e Notas Fiscais (Leitura de valor líquido real).

Dedução automática de impostos (IBS/CBS) na fonte.

Cálculos trabalhistas complexos (DSR, CLT vs PJ).

Justificativa: Urgência externa — reforma tributária e Split Payment exigem precisão fiscal antes de diferenciais de UX.

Fase 7: Automações com IA (Workflows Conversacionais)
Foco: Automações customizadas configuradas via linguagem natural.

Funcionalidade:

Interface de chat para criar regras de automação ("Quando o vendedor bater o próprio recorde, avise o gestor por email").

Triggers baseados em eventos (venda concretizada, meta batida, recorde pessoal).

Actions configuráveis (email, notificação push, webhook).

Preview antes de ativar ("Entendi assim: [regra]. Confirma?").

Objetivo: Diferencial competitivo — automação acessível sem UI complexa. Última fase porque é "nice to have", não essencial para operação.

---

7. Resumo do Roadmap

| Fase | Funcionalidade             | Justificativa            | Status       |
| ---- | -------------------------- | ------------------------ | ------------ |
| 1    | MVP                        | Resolve dor do gestor    | Em andamento |
| 2    | Transparência              | Acesso vendedor          | Pendente     |
| 3    | Produto/Margem + Campanhas | Regras complexas         | Pendente     |
| 4    | Comissão Recorrente        | Motor de regras avançado | Pendente     |
| 5    | Gamificação                | Engajamento              | Pendente     |
| 6    | Tributário                 | Compliance (penúltimo)   | Pendente     |
| 7    | IA                         | Diferencial (último)     | Pendente     |

**Por que Tributário antes de IA:**

- Tributário tem urgência externa (reforma tributária, Split Payment)
- IA é diferencial competitivo, mas não essencial para operação

**Por que Recorrência antes de Gamificação:**

- Recorrência é regra de cálculo (core do produto)
- Gamificação é UX/engajamento (camada acima)
