import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Configuração do Supabase para testes
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Senha padrão para todos os usuários de teste
 */
export const TEST_PASSWORD = 'Test@123456';

/**
 * Domínio de email para usuários de teste
 */
export const TEST_EMAIL_DOMAIN = '@test.ucomis.com';

/**
 * Tipo de plano
 */
export type PlanType = 'free' | 'pro' | 'ultra';

/**
 * Credenciais de usuário de teste
 */
export interface TestUserCredentials {
  id: string;
  email: string;
  password: string;
}

let supabaseAdmin: SupabaseClient | null = null;

/**
 * Obtém cliente Supabase com service role (admin)
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdmin;
}

/**
 * Dados retornados ao criar um usuário de teste
 */
export interface TestUserData {
  id: string;
  email: string;
}

/**
 * Cria um usuário de teste já confirmado via API Admin
 * Ideal para testes E2E - não precisa de confirmação de email
 */
export async function createTestUser(
  email: string,
  password: string,
  metadata?: { name?: string }
): Promise<TestUserData> {
  const supabase = getSupabaseAdmin();

  // Primeiro, limpa se já existir (para testes idempotentes)
  await cleanupTestUser(email);

  // Cria usuário já confirmado
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) {
    throw new Error(`Falha ao criar usuário de teste: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('Usuário não foi criado');
  }

  return {
    id: data.user.id,
    email: data.user.email!,
  };
}

/**
 * Cria usuário de teste e retorna credenciais para login
 */
export async function createTestUserWithCredentials(
  prefix: string = 'e2e-test'
): Promise<TestUserCredentials> {
  const timestamp = Date.now();
  const email = `${prefix}-${timestamp}${TEST_EMAIL_DOMAIN}`;

  const user = await createTestUser(email, TEST_PASSWORD, {
    name: `Test User ${timestamp}`,
  });

  return {
    id: user.id,
    email: user.email,
    password: TEST_PASSWORD,
  };
}

/**
 * Verifica se um usuário existe pelo email
 */
export async function userExists(email: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.auth.admin.listUsers();
  return data?.users?.some(u => u.email === email) ?? false;
}

/**
 * Busca usuário auth pelo email
 */
export async function findUserByEmail(email: string): Promise<{ id: string; email: string; email_confirmed_at: string | null } | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.auth.admin.listUsers();
  const user = data?.users?.find(u => u.email === email);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email!,
    email_confirmed_at: user.email_confirmed_at ?? null,
  };
}

/**
 * Confirma email de um usuário via API Admin
 * Simula o clique no link de confirmação do email
 */
export async function confirmUserEmail(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });
  if (error) {
    throw new Error(`Falha ao confirmar email: ${error.message}`);
  }
}

/**
 * Confirma email de um usuário pelo email
 * Busca o usuário e confirma
 */
export async function confirmUserEmailByEmail(email: string): Promise<void> {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error(`Usuário não encontrado: ${email}`);
  }
  await confirmUserEmail(user.id);
}

/**
 * Busca profile de usuário por email
 */
export async function findProfileByEmail(email: string): Promise<unknown> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();
  return data;
}

/**
 * Atualiza data de criação do usuário (para simular trial)
 */
export async function setUserCreationDate(
  userId: string,
  daysAgo: number
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  await supabase
    .from('profiles')
    .update({ created_at: date.toISOString() })
    .eq('id', userId);
}

/**
 * Atualiza data de início da subscription (para simular período)
 */
export async function setSubscriptionStartDate(
  userId: string,
  daysAgo: number
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  await supabase
    .from('profiles')
    .update({ subscription_start_date: date.toISOString() })
    .eq('id', userId);
}

/**
 * Define o plano do usuário diretamente no banco
 */
export async function setUserPlan(
  userId: string,
  plan: 'free' | 'pro' | 'ultra'
): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase
    .from('profiles')
    .update({ plan })
    .eq('id', userId);
}

/**
 * Limpa dados de teste do banco
 */
export async function cleanupTestUser(email: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Busca o usuário
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find(u => u.email === email);

  if (user) {
    // Remove profile
    await supabase.from('profiles').delete().eq('id', user.id);
    // Remove auth user
    await supabase.auth.admin.deleteUser(user.id);
  }
}

/**
 * Cria subscription pendente para testes
 */
export async function createPendingSubscription(
  userId: string,
  plan: 'pro' | 'ultra'
): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase
    .from('profiles')
    .update({
      pending_plan: plan,
      subscription_status: 'pending',
    })
    .eq('id', userId);
}

/**
 * Busca dados completos do profile
 */
export async function getFullProfile(userId: string): Promise<unknown> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

/**
 * Busca subscription do usuário
 */
export async function getUserSubscription(userId: string): Promise<{
  user_id: string;
  plan_group: string;
  asaas_subscription_id: string | null;
  asaas_customer_id: string | null;
  current_period_end: string | null;
} | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data;
}

/**
 * Busca subscription pelo asaas_subscription_id
 */
export async function getSubscriptionByAsaasId(asaasSubscriptionId: string): Promise<unknown> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('asaas_subscription_id', asaasSubscriptionId)
    .single();
  return data;
}

/**
 * Define current_period_end para a subscription do usuário
 * Útil para simular um usuário com assinatura ativa
 */
export async function setCurrentPeriodEnd(
  userId: string,
  daysFromNow: number = 30
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);

  await supabase
    .from('user_subscriptions')
    .update({ current_period_end: date.toISOString() })
    .eq('user_id', userId);
}

/**
 * Limpa campos de downgrade e cancelamento para reset de testes
 */
export async function resetSubscriptionState(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  await supabase
    .from('user_subscriptions')
    .update({
      pending_plan_group: null,
      pending_plan_id: null,
      cancel_at_period_end: false,
      canceled_at: null,
      cancel_reason: null,
    })
    .eq('user_id', userId);
}

// =====================================================
// ROTINAS INTELIGENTES DE REUTILIZAÇÃO DE USUÁRIOS
// =====================================================

/**
 * Busca um usuário de teste existente por plano
 * Usuários de teste são identificados pelo domínio @test.ucomis.com
 */
export async function findTestUserByPlan(plan: PlanType): Promise<TestUserCredentials | null> {
  const supabase = getSupabaseAdmin();

  // Busca usuários de teste (email termina com @test.ucomis.com)
  const { data: users } = await supabase.auth.admin.listUsers();
  const testUsers = users?.users?.filter(u => u.email?.endsWith(TEST_EMAIL_DOMAIN)) || [];

  for (const user of testUsers) {
    // Busca a subscription do usuário
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('plan_group')
      .eq('user_id', user.id)
      .single();

    const userPlan = subscription?.plan_group || 'free';

    if (userPlan === plan) {
      return {
        id: user.id,
        email: user.email!,
        password: TEST_PASSWORD,
      };
    }
  }

  return null;
}

/**
 * Busca qualquer usuário de teste existente
 */
export async function findAnyTestUser(): Promise<TestUserCredentials | null> {
  const supabase = getSupabaseAdmin();

  const { data: users } = await supabase.auth.admin.listUsers();
  const testUser = users?.users?.find(u => u.email?.endsWith(TEST_EMAIL_DOMAIN));

  if (testUser) {
    return {
      id: testUser.id,
      email: testUser.email!,
      password: TEST_PASSWORD,
    };
  }

  return null;
}

/**
 * Garante que existe um usuário de teste (qualquer plano)
 * Se não existir, cria um novo
 */
export async function ensureTestUser(): Promise<TestUserCredentials> {
  // 1. Tenta encontrar um usuário de teste existente
  const existing = await findAnyTestUser();
  if (existing) {
    console.log(`[ensureTestUser] Reutilizando usuário existente: ${existing.email}`);
    return existing;
  }

  // 2. Se não existe, cria um novo
  console.log('[ensureTestUser] Criando novo usuário de teste...');
  const newUser = await createTestUserWithCredentials('e2e-test');
  return {
    id: newUser.id,
    email: newUser.email,
    password: TEST_PASSWORD,
  };
}

/**
 * Garante que existe um usuário de teste com plano específico
 *
 * Fluxo:
 * 1. Busca usuário de teste com o plano desejado → Retorna se encontrar
 * 2. Busca usuário de teste com plano inferior → Retorna para fazer upgrade via UI
 * 3. Se não encontrar ninguém → Cria novo usuário
 *
 * NOTA: Esta função NÃO faz a assinatura automaticamente.
 * Retorna { user, needsSubscription: true } se precisar assinar via UI.
 */
export async function ensureTestUserWithPlan(plan: PlanType): Promise<{
  user: TestUserCredentials;
  needsSubscription: boolean;
  currentPlan: PlanType;
}> {
  // 1. Busca usuário com o plano exato
  const exactMatch = await findTestUserByPlan(plan);
  if (exactMatch) {
    console.log(`[ensureTestUserWithPlan] Encontrou usuário com plano ${plan}: ${exactMatch.email}`);
    return { user: exactMatch, needsSubscription: false, currentPlan: plan };
  }

  // 2. Se precisa de 'pro' ou 'ultra', busca usuário com plano inferior para upgrade
  if (plan !== 'free') {
    // Tenta encontrar usuário free para assinar
    const freeUser = await findTestUserByPlan('free');
    if (freeUser) {
      console.log(`[ensureTestUserWithPlan] Encontrou usuário free para assinar ${plan}: ${freeUser.email}`);
      return { user: freeUser, needsSubscription: true, currentPlan: 'free' };
    }

    // Se precisa de 'ultra', tenta encontrar usuário 'pro' para upgrade
    if (plan === 'ultra') {
      const proUser = await findTestUserByPlan('pro');
      if (proUser) {
        console.log(`[ensureTestUserWithPlan] Encontrou usuário pro para upgrade: ${proUser.email}`);
        return { user: proUser, needsSubscription: true, currentPlan: 'pro' };
      }
    }
  }

  // 3. Busca qualquer usuário de teste
  const anyUser = await findAnyTestUser();
  if (anyUser) {
    // Descobre o plano atual
    const supabase = getSupabaseAdmin();
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('plan_group')
      .eq('user_id', anyUser.id)
      .single();

    const currentPlan = (subscription?.plan_group || 'free') as PlanType;
    const needsSubscription = currentPlan !== plan;

    console.log(`[ensureTestUserWithPlan] Usando usuário existente (${currentPlan}): ${anyUser.email}`);
    return { user: anyUser, needsSubscription, currentPlan };
  }

  // 4. Não encontrou ninguém, cria novo
  console.log(`[ensureTestUserWithPlan] Criando novo usuário para plano ${plan}...`);
  const newUser = await createTestUserWithCredentials('e2e-test');
  return {
    user: { id: newUser.id, email: newUser.email, password: TEST_PASSWORD },
    needsSubscription: plan !== 'free',
    currentPlan: 'free',
  };
}
