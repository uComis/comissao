'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { sendTestPaymentOverdueEmail, sendTestAccountSuspendedEmail, sendTestSubscriptionCancelledEmail } from '@/app/actions/debug-email-actions';

export default function DebugEmailPage() {
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const handleTestPaymentOverdue = async () => {
    if (!testEmail) {
      toast.error('Digite um email para teste');
      return;
    }

    setLoading('overdue');
    try {
      const result = await sendTestPaymentOverdueEmail(testEmail);

      if (result.success) {
        toast.success('Email enviado com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao enviar email');
      }
    } catch (error) {
      toast.error('Erro ao enviar email');
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleTestAccountSuspended = async () => {
    if (!testEmail) {
      toast.error('Digite um email para teste');
      return;
    }

    setLoading('suspended');
    try {
      const result = await sendTestAccountSuspendedEmail(testEmail);

      if (result.success) {
        toast.success('Email enviado com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao enviar email');
      }
    } catch (error) {
      toast.error('Erro ao enviar email');
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleTestSubscriptionCancelled = async (reason: 'user_request' | 'non_payment') => {
    if (!testEmail) {
      toast.error('Digite um email para teste');
      return;
    }

    setLoading(`cancelled-${reason}`);
    try {
      const result = await sendTestSubscriptionCancelledEmail(testEmail, reason);

      if (result.success) {
        toast.success('Email enviado com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao enviar email');
      }
    } catch (error) {
      toast.error('Erro ao enviar email');
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Debug Email</h1>
        <p className="text-muted-foreground">Teste os templates de email do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração</CardTitle>
          <CardDescription>Email de destino para os testes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="test-email">Email para teste</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="seu@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              ⚠️ Certifique-se de que RESEND_API_KEY está configurado no .env
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Overdue (D+0)</CardTitle>
            <CardDescription>Email enviado quando pagamento está atrasado</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleTestPaymentOverdue}
              disabled={!testEmail || loading === 'overdue'}
              className="w-full"
            >
              {loading === 'overdue' ? 'Enviando...' : 'Enviar Teste'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Suspended (D+2)</CardTitle>
            <CardDescription>Email enviado quando conta é suspensa</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleTestAccountSuspended}
              disabled={!testEmail || loading === 'suspended'}
              className="w-full"
            >
              {loading === 'suspended' ? 'Enviando...' : 'Enviar Teste'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Cancelled (User Request)</CardTitle>
            <CardDescription>Email enviado quando usuário cancela</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleTestSubscriptionCancelled('user_request')}
              disabled={!testEmail || loading === 'cancelled-user_request'}
              className="w-full"
            >
              {loading === 'cancelled-user_request' ? 'Enviando...' : 'Enviar Teste'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Cancelled (Non Payment)</CardTitle>
            <CardDescription>Email enviado quando cancela por não pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleTestSubscriptionCancelled('non_payment')}
              disabled={!testEmail || loading === 'cancelled-non_payment'}
              className="w-full"
            >
              {loading === 'cancelled-non_payment' ? 'Enviando...' : 'Enviar Teste'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-yellow-500">
        <CardHeader>
          <CardTitle>⚠️ Atenção</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• Estes emails serão enviados para o endereço configurado acima</p>
          <p>• Certifique-se de que o domínio está verificado no Resend</p>
          <p>• Os emails virão de: <strong>contato@ucomis.com</strong></p>
          <p>• Verifique a caixa de spam se não receber</p>
        </CardContent>
      </Card>
    </div>
  );
}
