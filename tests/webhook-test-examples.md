# Estratégias de Teste para Webhook do Asaas

## 📋 Resumo

**Asaas Sandbox:**
- ✅ Permite simular pagamento via API: `POST /v3/bill/simulate`
- ✅ Para subscriptions: criar subscription → pegar payment ID → simular

**3 Estratégias de Teste:**

---

## 🎯 Opção A: Mock do Webhook (Recomendado - Testes Unitários)

**Quando usar:** Testes rápidos, CI/CD, sem dependência externa

```typescript
// tests/webhook.test.ts
import { POST } from '@/app/api/webhooks/asaas/route'
import { createAdminClient } from '@/lib/supabase-server'

describe('Webhook Asaas - PAYMENT_CONFIRMED', () => {
  it('deve ativar plano quando receber PAYMENT_CONFIRMED', async () => {
    // 1. Setup: Criar usuário e subscription no banco
    const supabase = createAdminClient()
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'test123'
    })
    
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.user.id,
        plan_group: 'pro',
        asaas_subscription_id: 'sub_test_123',
        current_period_end: null, // Ainda não ativado
      })
      .select()
      .single()

    // 2. Mock do payload do Asaas
    const mockWebhookPayload = {
      event: 'PAYMENT_CONFIRMED',
      payment: {
        id: 'pay_test_123',
        subscription: 'sub_test_123',
        status: 'CONFIRMED',
        value: 29.90,
        paymentDate: new Date().toISOString(),
      }
    }

    // 3. Chamar webhook
    const request = new Request('http://localhost/api/webhooks/asaas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'asaas-access-token': process.env.ASAAS_WEBHOOK_TOKEN || '',
      },
      body: JSON.stringify(mockWebhookPayload),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    // 4. Verificar se plano foi ativado
    const { data: updatedSub } = await supabase
      .from('user_subscriptions')
      .select('current_period_end, current_period_start')
      .eq('user_id', user.user.id)
      .single()

    expect(updatedSub.current_period_end).not.toBeNull()
    expect(updatedSub.current_period_start).not.toBeNull()
  })
})
```

**Vantagens:**
- ✅ Rápido (sem chamadas externas)
- ✅ Confiável (não depende de API externa)
- ✅ Controlável (você define o payload)
- ✅ Funciona em CI/CD

---

## 🔗 Opção B: Simular via API do Asaas (Testes de Integração)

**Quando usar:** Testes end-to-end, validar integração real

```typescript
// tests/webhook-integration.test.ts
import { AsaasService } from '@/lib/clients/asaas'
import { createSubscription } from '@/app/actions/billing/subscriptions'
import { waitForWebhook } from './helpers'

describe('Webhook Asaas - Integração Real', () => {
  it('deve receber webhook após simular pagamento no Asaas', async () => {
    // 1. Criar subscription no Asaas (sandbox)
    const subscription = await createSubscription('plan_pro_id')
    const subscriptionId = subscription.subscriptionId

    // 2. Buscar payment gerado
    const payments = await AsaasService.getSubscriptionPayments(subscriptionId)
    const paymentId = payments.data[0].id

    // 3. Simular pagamento no Asaas (sandbox)
    await AsaasService.simulatePayment(paymentId)

    // 4. Aguardar webhook (com timeout)
    const webhookReceived = await waitForWebhook(subscriptionId, 10000) // 10s timeout

    expect(webhookReceived).toBe(true)

    // 5. Verificar se plano foi ativado no banco
    const { data: sub } = await supabase
      .from('user_subscriptions')
      .select('current_period_end')
      .eq('asaas_subscription_id', subscriptionId)
      .single()

    expect(sub.current_period_end).not.toBeNull()
  })
})

// helpers/webhook.ts
export async function waitForWebhook(
  subscriptionId: string,
  timeout: number = 10000
): Promise<boolean> {
  const start = Date.now()
  
  while (Date.now() - start < timeout) {
    const { data } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_type', 'PAYMENT_CONFIRMED')
      .contains('payload', { payment: { subscription: subscriptionId } })
      .single()
    
    if (data) return true
    
    await new Promise(resolve => setTimeout(resolve, 500)) // Poll a cada 500ms
  }
  
  return false
}
```

**Vantagens:**
- ✅ Testa integração real com Asaas
- ✅ Valida fluxo completo
- ✅ Detecta mudanças na API do Asaas

**Desvantagens:**
- ⚠️ Mais lento (chamadas externas)
- ⚠️ Precisa de API key do sandbox
- ⚠️ Pode falhar se Asaas estiver fora

---

## ⚡ Opção C: Chamar activatePlan() Diretamente (Testes de Lógica)

**Quando usar:** Testar lógica de ativação sem depender do webhook

```typescript
// tests/activate-plan.test.ts
import { activatePlan } from '@/app/actions/billing/subscriptions'
import { AsaasService } from '@/lib/clients/asaas'

describe('activatePlan() - Lógica de Ativação', () => {
  it('deve calcular período corretamente para plano mensal', async () => {
    // 1. Setup: Subscription já criada no Asaas
    const subscriptionId = 'sub_test_123'
    
    // 2. Mock do AsaasService para retornar dados de teste
    jest.spyOn(AsaasService, 'getSubscription').mockResolvedValue({
      id: subscriptionId,
      cycle: 'MONTHLY',
      value: 29.90,
    })
    
    jest.spyOn(AsaasService, 'getSubscriptionPayments').mockResolvedValue({
      data: [{
        id: 'pay_123',
        status: 'CONFIRMED',
        paymentDate: '2026-01-23',
        dueDate: '2026-01-23',
      }],
    })

    // 3. Chamar activatePlan diretamente
    await activatePlan('user_id_123', subscriptionId)

    // 4. Verificar cálculo do período
    const { data: sub } = await supabase
      .from('user_subscriptions')
      .select('current_period_start, current_period_end')
      .eq('user_id', 'user_id_123')
      .single()

    const periodStart = new Date(sub.current_period_start)
    const periodEnd = new Date(sub.current_period_end)
    
    // Deve ser 1 mês de diferença
    expect(periodEnd.getMonth() - periodStart.getMonth()).toBe(1)
  })
})
```

**Vantagens:**
- ✅ Rápido
- ✅ Testa lógica específica
- ✅ Não depende de webhook

**Desvantagens:**
- ⚠️ Não testa o webhook em si

---

## 🎯 Recomendação Final

**Para Test 4 (Subscribe):**
- Use **Opção C** (`activatePlan()` direto) para testes automatizados
- Use **Opção A** (mock) para testar o webhook endpoint separadamente

**Para Test 5 (Upgrade):**
- Use **Opção C** com setup completo de subscription (datas corretas)

**Para Test 6 (Downgrade):**
- Use **Opção C** para testar lógica de downgrade

**Para Test de Webhook (novo):**
- Use **Opção A** (mock) para testes unitários
- Use **Opção B** (API real) para testes de integração (opcional)

---

## 📝 Setup do Asaas Sandbox

1. Criar conta em: https://sandbox.asaas.com/
2. Gerar API Key
3. Configurar `.env.test`:
   ```
   ASAAS_API_URL=https://api-sandbox.asaas.com/api/v3
   ASAAS_API_KEY=sua_key_do_sandbox
   ASAAS_WEBHOOK_TOKEN=seu_token_de_seguranca
   ```

---

## 🔍 Verificar Webhook no Asaas

No painel do Asaas Sandbox:
1. Configurações → Webhooks
2. Adicionar URL: `https://seu-app.vercel.app/api/webhooks/asaas`
3. Selecionar eventos: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `SUBSCRIPTION_DELETED`

**Para testes locais:** Use ngrok ou similar para expor localhost.
