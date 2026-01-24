'use server';

import { EmailService } from '@/lib/email/email-service';
import { createAdminClient } from '@/lib/supabase-server';
import PaymentOverdueEmail from '@/lib/email/templates/payment-overdue';
import AccountSuspendedEmail from '@/lib/email/templates/account-suspended';
import SubscriptionCancelledEmail from '@/lib/email/templates/subscription-cancelled';

/**
 * Actions de email com regras de negócio
 * Busca dados do usuário e envia emails usando os templates corretos
 */

interface UserData {
  email: string;
  name: string | null;
}

/**
 * Busca dados do usuário para envio de email
 */
async function getUserData(userId: string): Promise<UserData | null> {
  const supabase = createAdminClient();
  
  const { data: user } = await supabase.auth.admin.getUserById(userId);
  if (!user.user?.email) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', userId)
    .single();

  return {
    email: user.user.email,
    name: profile?.full_name || null,
  };
}

/**
 * Envia email de pagamento atrasado (D+0)
 */
export async function sendPaymentOverdueEmail(
  userId: string,
  planName: string,
  amount: number,
  daysOverdue: number = 0,
  paymentUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userData = await getUserData(userId);
    if (!userData) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    await EmailService.sendTemplatedEmail({
      to: userData.email,
      subject: `Pagamento do plano ${planName} em atraso`,
      react: PaymentOverdueEmail({
        userName: userData.name || 'Usuário',
        planName,
        daysOverdue,
        amount,
        paymentUrl,
      }),
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de pagamento atrasado:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Envia email de conta suspensa (D+2)
 */
export async function sendAccountSuspendedEmail(
  userId: string,
  planName: string,
  reactivateUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userData = await getUserData(userId);
    if (!userData) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    await EmailService.sendTemplatedEmail({
      to: userData.email,
      subject: 'Sua conta uComis foi suspensa',
      react: AccountSuspendedEmail({
        userName: userData.name || 'Usuário',
        planName,
        suspendedDate: new Date().toLocaleDateString('pt-BR'),
        reactivateUrl,
      }),
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de conta suspensa:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Envia email de assinatura cancelada (D+30 ou por solicitação do usuário)
 */
export async function sendSubscriptionCancelledEmail(
  userId: string,
  planName: string,
  reason: 'user_request' | 'non_payment',
  reactivateUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userData = await getUserData(userId);
    if (!userData) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    await EmailService.sendTemplatedEmail({
      to: userData.email,
      subject: `Assinatura do plano ${planName} cancelada`,
      react: SubscriptionCancelledEmail({
        userName: userData.name || 'Usuário',
        planName,
        cancelledDate: new Date().toLocaleDateString('pt-BR'),
        reason,
        reactivateUrl,
      }),
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de assinatura cancelada:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}
