# Plano de Testes E2E - Billing System

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

## 8. Webhook - Payment Confirmed

**Processo:**
- rotina: `ensureCorrectUser`
- rotina: `createPendingSubscription`
- rotina: `simulatePayment`
- processo: `verifyWebhookReceived`
- processo: `verifyIdempotencyHandling`
- processo: `verifyPlanActivation`
- processo: `verifyDatabaseUpdated`

**Objetivo:**
- Testar recebimento de webhook PAYMENT_CONFIRMED
- Verificar processamento correto do evento
- Verificar idempotência (envio duplicado não causa problemas)
- Verificar ativação do plano via `activatePlan()`
- Verificar atualização de status no banco

---

## 9. Webhook - Payment Overdue

**Processo:**
- rotina: `ensureCorrectUser`
- rotina: `createActiveSubscription`
- rotina: `simulatePaymentOverdue`
- processo: `verifyWebhookReceived`
- processo: `verifyPlanNotDeactivated`
- processo: `verifyNotificationSent`

**Objetivo:**
- Testar recebimento de webhook PAYMENT_OVERDUE
- Verificar que plano não é desativado imediatamente
- Verificar envio de notificação ao usuário
- Verificar logging do evento

---

## 10. Webhook - Subscription Deleted

**Processo:**
- rotina: `ensureCorrectUser`
- rotina: `createActiveSubscription`
- rotina: `deleteSubscriptionViaAsaas`
- processo: `verifyWebhookReceived`
- processo: `verifyPlanDeactivated`
- processo: `verifyDatabaseUpdated`

**Objetivo:**
- Testar recebimento de webhook SUBSCRIPTION_DELETED
- Verificar desativação do plano
- Verificar atualização de status no banco
- Verificar que usuário perde acesso

---

## 11. Trial Expiration

**Processo:**
- rotina: `ensureCorrectUser`
- rotina: `setUserCreationDate` (15 dias atrás)
- rotina: `simulateTrialExpiration`
- processo: `verifyTrialExpired`
- processo: `verifyAccessRestricted`
- processo: `verifyUpgradePrompt`

**Objetivo:**
- Testar expiração do período de trial
- Verificar que acesso é restringido após expiração
- Verificar apresentação de prompt para upgrade
- Verificar cálculo correto de dias restantes

---

## 12. Payment Failure

**Processo:**
- rotina: `ensureCorrectUser`
- rotina: `createPendingSubscription`
- rotina: `simulatePaymentFailure`
- processo: `verifyWebhookReceived`
- processo: `verifyPlanNotActivated`
- processo: `verifyErrorHandling`
- processo: `verifyUserNotification`

**Objetivo:**
- Testar falha no pagamento
- Verificar que plano não é ativado
- Verificar tratamento correto do erro
- Verificar notificação ao usuário sobre falha
- Verificar possibilidade de retry

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