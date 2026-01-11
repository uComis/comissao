# Implementação Trial ULTRA Completa - Resumo

## ✅ CONCLUÍDO

### 1. **Tabela `plans` - Adicionar `trial_days`** ✅

```sql
ALTER TABLE plans ADD COLUMN trial_days INTEGER DEFAULT 14;
UPDATE plans SET trial_days = 14 WHERE id LIKE 'ultra_%';
UPDATE plans SET trial_days = NULL WHERE id NOT LIKE 'ultra_%';
```

### 2. **`setupTrialSubscription()` - Usar ULTRA** ✅

- Busca `ultra_monthly` (não mais FREE)
- Usa `ultraPlan.trial_days` do banco (dinâmico!)
- Plan_snapshot com limites ULTRA ilimitados

### 3. **Funções de Transição** ✅

**`handleExpiredTrials()`** - Cron job (admin)

- Busca trials expirados
- Se `trialing` → downgrade pra FREE

**`checkAndHandleExpiredTrial(userId)`** - Por usuário

- Chamado no middleware em cada request
- Detecta trial expirado e faz downgrade na hora

### 4. **Banner Atualizado** ✅

- ✅ Texto: "teste ULTRA (ilimitado)"
- ✅ Só aparece se `status === 'trialing'`
- ✅ Some automaticamente quando assina (status muda pra `active`)

### 5. **FAQ Atualizado** ✅

Novo texto explica tudo:

> "14 dias de teste ULTRA ilimitado... Se assinar durante o teste, mantém ULTRA até fim dos 14 dias (recompensa!) e depois aplica limites do plano pago. Se não assinar, cai pro FREE sem perder dados."

### 6. **Middleware - Verificação Automática** ✅

- Chama `checkAndHandleExpiredTrial()` em toda request autenticada
- Não bloqueia (async, catch de erros)
- Garante downgrade assim que trial expira

---

## 🎯 Fluxo Completo

### Novo usuário:

1. ✅ Cria conta → `setupTrialSubscription()`
2. ✅ Status: `trialing`, plan_id: `ultra_monthly`
3. ✅ Limites: ULTRA (ilimitado)
4. ✅ Banner: "13 dias de teste ULTRA (ilimitado)"

### Durante trial → Assina PRO:

1. ✅ Nova subscription criada: `status: 'active'`, `plan_id: 'pro_monthly'`
2. ✅ `trial_ends_at` mantém data original
3. ✅ **Limites continuam ULTRA até trial acabar** (Opção 2)
4. ✅ Banner some (status != 'trialing')
5. ✅ Quando `trial_ends_at` passa → downgrade pra limites PRO

### Trial expira sem assinar:

1. ✅ Middleware detecta `trial_ends_at < NOW()`
2. ✅ Chama `checkAndHandleExpiredTrial()`
3. ✅ Downgrade: `plan_id: 'free_monthly'`, `status: 'active'`
4. ✅ Limites: 1 pasta, 30 vendas/mês, 30 dias dados
5. ✅ **Dados nunca são deletados**

---

## 🔄 Como Mudar Dias de Trial

**Antes:** Hardcoded no código (linha 164)
**Agora:** Banco de dados

```sql
-- Mudar de 14 → 9 dias
UPDATE plans SET trial_days = 9 WHERE id LIKE 'ultra_%';
```

Efeito imediato, sem deploy.

---

## 🚀 Próximos Passos (Opcional)

1. **Cron job**: Rodar `handleExpiredTrials()` diariamente (backup do middleware)
2. **Email notificação**: Avisar 3 dias antes do trial expirar
3. **Analytics**: Track quantos convertem durante trial

---

**Status: 100% Implementado e Testável**
