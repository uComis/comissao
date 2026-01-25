import { Page } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Configuração do Supabase para testes
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
): Promise<{ email: string; password: string; id: string }> {
  const timestamp = Date.now();
  const email = `${prefix}-${timestamp}@test.ucomis.com`;
  const password = 'Test@123456';

  const user = await createTestUser(email, password, {
    name: `Test User ${timestamp}`,
  });

  return {
    id: user.id,
    email: user.email,
    password,
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
