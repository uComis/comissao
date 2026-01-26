# Plano de Testes E2E - Billing System

---

## 📊 STATUS GERAL (Atualizado: 2026-01-26)

| Teste | Status | Resultado |
|-------|--------|-----------|
| 1. Register User | ✅ Implementado | ✅ Passando |
| 2. Login User | ✅ Implementado | ✅ Passando |
| 3. Update User Profile | ✅ Implementado | ✅ Passando |
| 4. Subscribe to Pro Plan | ✅ Implementado | ✅ Passando (4/4) |
| 5. Upgrade Pro to Ultra | ✅ Implementado | ✅ Passando (4/4) |
| 6. Downgrade Ultra to Pro | ✅ Implementado | ✅ Passando (4/4) |
| 7. Cancel Subscription | ✅ Implementado | ✅ Passando (4/4) |
| 8-12. Webhooks/Trial/Payment | ❌ Não necessário | N/A |

### ✅ TODOS OS TESTES PASSANDO (24/24)

**Migration aplicada em 2026-01-26** via Supabase MCP.

---

## 🔗 ARQUITETURA: CADEIA REAL DE TESTES

Os testes E2E formam uma **cadeia real** onde cada teste depende do anterior:

```
1-register → 2-login → 3-profile → 4-subscribe → 5-upgrade
     ↓
Se Register falhar, TODOS os outros falham ✅
```

### Como funciona

1. **1-register.spec.ts** - Cria usuário via UI REAL e salva credenciais
2. **2-login.spec.ts** - USA as credenciais salvas (não cria via API)
3. **3-profile.spec.ts** - USA o mesmo usuário
4. **4-subscribe.spec.ts** - USA o mesmo usuário, cria assinatura REAL no Asaas
5. **5-upgrade.spec.ts** - USA o mesmo usuário (agora Pro), faz upgrade REAL

### Simulações justificáveis (impossível fazer de outra forma)

| Simulação | Motivo |
|-----------|--------|
| Confirmação de email | Não tem como automatizar clique em email real |
| Pagamento no Asaas | Não tem como fazer cobrança real em teste automatizado |

### Testes de UI (6-7)

Os testes de **downgrade** e **cancel** são testes de UI separados que usam atalhos no banco para configurar o ambiente. Isso é aceitável porque:
- São testes destrutivos (mudariam estado irreversivelmente)
- Os testes 1-5 já garantem que o fluxo real funciona

### Estado compartilhado

O arquivo `e2e/state/test-user.json` armazena as credenciais do usuário criado pelo Register. Este arquivo é ignorado pelo git.

### 📝 COMANDOS ÚTEIS

```bash
# Rodar todos os testes E2E (cadeia completa)
npm run e2e

# Rodar só a cadeia principal (1-5)
npm run e2e -- 1-register.spec.ts 2-login.spec.ts 3-profile.spec.ts 4-subscribe.spec.ts 5-upgrade.spec.ts

# Rodar só testes de UI (6-7)
npm run e2e -- 6-downgrade.spec.ts 7-cancel.spec.ts

# Rodar com browser visível
npm run e2e:headed

# Ver relatório
npm run e2e:report
```

### 🧪 ÚLTIMO RESULTADO DOS TESTES (2026-01-26)

```
Running 24 tests using 1 worker

✓ Register - deve permitir que um novo usuário se cadastre (100% UI)
✓ Login - 4 testes (100% UI)
✓ Profile - 3 testes (100% UI)
✓ Subscribe - 4 testes (100% UI + Asaas real)
✓ Upgrade - 4 testes (100% UI + Asaas real)
✓ Downgrade - 4 testes (UI com atalhos)
✓ Cancel - 4 testes (UI com atalhos)

24 passed (3.7m)
```

---

## 1. Register User

**Processo:**
- rotina: `navigateToRegistrationPage`
- processo: `fillRegistrationForm`
- processo: `verifyRegistrationSuccess`

**Objetivo:**
- Testar cadastro de novo usuário via UI
- Verificar criação de conta no Supabase Auth
- Verificar criação de profile no banco
- Verificar login automático após registro
- Garantir que não requer confirmação de email (env configurado)

---

## 2. Login User

**Processo:**
- rotina: `ensureLoggedOut`
- rotina: `navigateToLoginPage`
- processo: `fillLoginForm`
- processo: `verifyLoginSuccess`

**Objetivo:**
- Testar login de usuário existente
- Verificar autenticação no Supabase
- Verificar redirecionamento correto após login
- Verificar sessão ativa

---

## 3. Update User Profile

**Processo:**
- rotina: `ensureCorrectUser`
- rotina: `navigateToProfilePage`
- processo: `updateNameAndDocument`
- processo: `verifyProfileUpdated`

**Objetivo:**
- Testar atualização de dados do perfil (nome e CPF/CNPJ)
- Verificar persistência no banco
- Verificar feedback visual de sucesso (toast)

**Nota:** A atualização é apenas local. Os dados só são usados em futuras vendas/assinaturas, não há sincronização imediata com Asaas.

---

## 4. Subscribe to Pro Plan

**Processo:**
- rotina: `ensureCorrectUser`
- rotina: `navigateToPricingPage`
- processo: `selectProPlan`
- processo: `fillSubscriptionForm`
- rotina: `simulatePayment`
- rotina: `waitForWebhook`
- processo: `verifyProPlanActivated`

**Objetivo:**
- Testar fluxo completo de assinatura do plano Pro
- Verificar criação de customer no Asaas
- Verificar criação de subscription no Asaas
- Verificar geração de fatura
- Verificar processamento de webhook após pagamento
- Verificar ativação do plano no profile do usuário
- Verificar data de expiração correta (30 dias para mensal)

---

## 5. Upgrade Pro to Ultra (with proportional credit)

**Processo:**
- rotina: `ensureCorrectUser`
- rotina: `setUserSubscriptionDate` (20 dias atrás)
- rotina: `navigateToPricingPage`
- processo: `selectUltraPlan`
- processo: `verifyProportionalCreditCalculation`
- processo: `fillUpgradeForm`
- rotina: `simulatePayment`
- rotina: `waitForWebhook`
- processo: `verifyUltraPlanActivated`
- processo: `verifyProSubscriptionCancelled`

**Objetivo:**
- Testar upgrade de Pro para Ultra
- Verificar cálculo correto de crédito proporcional
- Verificar aplicação do desconto na fatura
- Verificar cancelamento automático da assinatura Pro
- Verificar ativação do plano Ultra
- Verificar nova data de expiração

---

## 6. Downgrade Ultra to Pro (scheduled for next period)

**Processo:**
- rotina: `ensureCorrectUser`
- rotina: `setUserSubscriptionDate` (20 dias atrás, plano Ultra)
- rotina: `navigateToPricingPage`
- processo: `selectProPlanAsDowngrade`
- processo: `verifyDowngradeScheduling`
- processo: `verifyCurrentPlanStillActive`
- rotina: `simulateSubscriptionPeriodEnd`
- processo: `verifyProPlanActivatedNextPeriod`

**Objetivo:**
- Testar downgrade de Ultra para Pro
- Verificar agendamento correto para próximo período
- Verificar que plano Ultra permanece ativo até o fim
- Verificar criação de nova subscription Pro agendada
- Verificar transição automática no fim do período
- Verificar que não há reembolso

---

## 7. Cancel Subscription

**Processo:**
- rotina: `ensureCorrectUser`
- rotina: `navigateToSubscriptionPage`
- processo: `clickCancelSubscription`
- processo: `confirmCancellation`
- processo: `verifyCancellationScheduled`
- processo: `verifyAccessStillActive`
- rotina: `simulateSubscriptionPeriodEnd`
- processo: `verifyPlanDeactivated`

**Objetivo:**
- Testar cancelamento de assinatura
- Verificar que acesso permanece até fim do período pago
- Verificar agendamento correto do cancelamento
- Verificar cancelamento no Asaas
- Verificar desativação automática no fim do período
- Verificar que não há reembolso

---

## 8-12. Webhooks, Trial e Payment Failure

> **NOTA:** Estes testes foram considerados **desnecessários** para implementação E2E:
> - **Webhooks (8-10):** Já são testados implicitamente nos testes de subscribe/upgrade. O webhook é chamado automaticamente quando o pagamento é simulado no Asaas.
> - **Trial Expiration (11):** O sistema de trial funciona com 14 dias de acesso ULTRA. Após expirar, o usuário cai para FREE automaticamente. Não há ação de UI para testar.
> - **Payment Failure (12):** O Asaas gerencia isso automaticamente. O sistema apenas reage aos webhooks.

**Status:** ❌ Não implementado (não necessário)

---

## Sumário de Rotinas Compartilhadas

- `ensureCorrectUser` - Garante que usuário correto está logado, cria se necessário
- `ensureLoggedOut` - Garante que nenhum usuário está logado
- `navigateToRegistrationPage` - Navega para página de registro
- `navigateToLoginPage` - Navega para página de login
- `navigateToPricingPage` - Navega para página de planos
- `navigateToProfilePage` - Navega para página de perfil
- `navigateToSubscriptionPage` - Navega para página de assinatura
- `simulatePayment` - Marca fatura como paga via Asaas simulate API
- `waitForWebhook` - Aguarda processamento completo de webhook
- `setUserCreationDate` - Manipula data de criação do usuário no DB
- `setUserSubscriptionDate` - Manipula data de início da assinatura no DB
- `createPendingSubscription` - Cria subscription pendente via API
- `createActiveSubscription` - Cria subscription ativa via API
- `deleteSubscriptionViaAsaas` - Cancela subscription via API Asaas
- `simulatePaymentOverdue` - Simula atraso de pagamento via Asaas
- `simulatePaymentFailure` - Simula falha de pagamento via Asaas
- `simulateTrialExpiration` - Manipula datas para simular trial expirado
- `simulateSubscriptionPeriodEnd` - Manipula datas para simular fim de período
- `cleanupTestData` - Limpa dados de teste do banco e Asaas