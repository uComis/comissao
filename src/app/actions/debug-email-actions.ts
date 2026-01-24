'use server';

import { EmailService } from '@/lib/email/email-service';
import PaymentOverdueEmail from '@/lib/email/templates/payment-overdue';
import AccountSuspendedEmail from '@/lib/email/templates/account-suspended';
import SubscriptionCancelledEmail from '@/lib/email/templates/subscription-cancelled';
import { createClient } from '@/lib/supabase';

/**
 * Actions de teste para debug de emails
 * Envia para o usuário logado
 */

export async function sendTestPaymentOverdueEmail(
  testEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user?.id)
      .single();

    await EmailService.sendTemplatedEmail({
      to: testEmail,
      subject: '[TESTE] Pagamento do plano Pro em atraso',
      react: PaymentOverdueEmail({
        userName: profile?.full_name || 'Usuário',
        planName: 'Pro',
        daysOverdue: 0,
        amount: 29.90,
        paymentUrl: 'https://ucomis.com/planos',
      }),
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de teste:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

export async function sendTestAccountSuspendedEmail(
  testEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user?.id)
      .single();

    await EmailService.sendTemplatedEmail({
      to: testEmail,
      subject: '[TESTE] Sua conta uComis foi suspensa',
      react: AccountSuspendedEmail({
        userName: profile?.full_name || 'Usuário',
        planName: 'Pro',
        suspendedDate: new Date().toLocaleDateString('pt-BR'),
        reactivateUrl: 'https://ucomis.com/planos',
      }),
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de teste:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

export async function sendTestSubscriptionCancelledEmail(
  testEmail: string,
  reason: 'user_request' | 'non_payment'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user?.id)
      .single();

    await EmailService.sendTemplatedEmail({
      to: testEmail,
      subject: `[TESTE] Assinatura do plano Pro cancelada`,
      react: SubscriptionCancelledEmail({
        userName: profile?.full_name || 'Usuário',
        planName: 'Pro',
        cancelledDate: new Date().toLocaleDateString('pt-BR'),
        reason,
        reactivateUrl: 'https://ucomis.com/planos',
      }),
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de teste:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

