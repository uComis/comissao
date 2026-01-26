# Plano de Testes E2E - Billing System

---

## 📊 STATUS GERAL (Atualizado: 2025-01-25)

| Teste | Status | Resultado |
|-------|--------|-----------|
| 1. Register User | ✅ Implementado | ✅ Passando |
| 2. Login User | ✅ Implementado | ✅ Passando |
| 3. Update User Profile | ✅ Implementado | ✅ Passando |
| 4. Subscribe to Pro Plan | ✅ Implementado | ✅ Passando (4/4) |
| 5. Upgrade Pro to Ultra | ✅ Implementado | ✅ Passando (4/4) |
| 6. Downgrade Ultra to Pro | ✅ Implementado | ⚠️ 3/4 passando |
| 7. Cancel Subscription | ✅ Implementado | ⚠️ 3/4 passando |
| 8-12. Webhooks/Trial/Payment | ❌ Não necessário | N/A |

### 🚧 BLOQUEIO ATUAL

**Os testes 6 e 7 têm 1 teste cada que falha porque a migration não foi aplicada.**

A migration `supabase/migrations/20250125_add_downgrade_and_cancel_fields.sql` precisa ser aplicada ao banco.

**Para aplicar, acesse:**
https://supabase.com/dashboard/project/sdptlukijdthbrrcbocr/sql/new

**E execute:**
```sql
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS pending_plan_group TEXT DEFAULT NULL;

ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS pending_plan_id TEXT DEFAULT NULL;

ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS cancel_reason TEXT DEFAULT NULL;
```

### 📁 ARQUIVOS CRIADOS/MODIFICADOS

**Novos arquivos:**
- `e2e/specs/downgrade.spec.ts` - Testes de downgrade
- `e2e/specs/cancel.spec.ts` - Testes de cancelamento
- `src/components/billing/downgrade-modal.tsx` - Modal de downgrade
- `src/components/billing/cancel-subscription-modal.tsx` - Modal de cancelamento
- `supabase/migrations/20250125_add_downgrade_and_cancel_fields.sql` - Migration

**Arquivos modificados:**
- `src/app/actions/billing/types.ts` - Novos campos no tipo UserSubscription
- `src/app/actions/billing/subscriptions.ts` - Novas actions (scheduleDowngrade, cancelSubscription, etc)
- `src/app/actions/user.ts` - Novos campos em UserBilling
- `src/app/(dashboard)/planos/planos-client.tsx` - Integração do DowngradeModal
- `src/app/(dashboard)/cobrancas/client.tsx` - Integração do CancelSubscriptionModal
- `src/components/billing/index.ts` - Exports dos novos modais
- `e2e/routines/database.ts` - Novas funções (setCurrentPeriodEnd, resetSubscriptionState)

### 🔧 O QUE FOI IMPLEMENTADO

1. **Sistema de Downgrade:**
   - Detecta quando usuário seleciona plano inferior
   - Abre modal informando que é downgrade
   - Mostra data até quando plano atual continua
   - Agenda mudança para próximo ciclo (não muda imediatamente)
   - Action `scheduleDowngrade()` salva pending_plan_group/pending_plan_id

2. **Sistema de Cancelamento:**
   - Botão "Cancelar assinatura" na página /cobrancas
   - Modal com informações sobre o cancelamento
   - Campo opcional para motivo do cancelamento
   - Action `cancelSubscription()` marca cancel_at_period_end=true
   - Usuário mantém acesso até fim do período

3. **Testes E2E:**
   - 4 testes de downgrade (3 validação + 1 ação)
   - 4 testes de cancelamento (3 validação + 1 ação)
   - Rotinas auxiliares para configurar current_period_end e resetar estado

### 🎯 PRÓXIMOS PASSOS

1. **Aplicar a migration** (bloqueio atual)
2. **Rodar os testes novamente** (`npm run e2e -- downgrade.spec.ts cancel.spec.ts`)
3. **Verificar se os 8 testes passam**
4. **Commit e push das mudanças**

### 📝 COMANDOS ÚTEIS

```bash
# Rodar todos os testes E2E
npm run e2e

# Rodar só downgrade e cancel
npm run e2e -- downgrade.spec.ts cancel.spec.ts

# Rodar com browser visível
npm run e2e:headed

# Ver relatório
npm run e2e:report
```

### 🧪 ÚLTIMO RESULTADO DOS TESTES (2025-01-25)

```
Running 8 tests using 8 workers

✓ Cancel 1. deve mostrar link de cancelar para usuário com plano pago (19.1s)
✓ Cancel 2. deve abrir modal ao clicar em cancelar (19.5s)
✓ Cancel 3. deve permitir fechar o modal sem cancelar (19.7s)
✘ Cancel 4. deve cancelar assinatura com sucesso - FALHA (migration não aplicada)

✓ Downgrade 1. deve mostrar plano Pro disponível para usuário Ultra (19.6s)
✓ Downgrade 2. deve abrir modal de downgrade ao selecionar plano inferior (20.4s)
✓ Downgrade 3. deve permitir cancelar o modal de downgrade (21.1s)
✘ Downgrade 4. deve agendar downgrade de Ultra para Pro - FALHA (migration não aplicada)

6 passed, 2 failed (29.3s)
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