import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from '@react-email/components';

interface SubscriptionCancelledEmailProps {
  userName: string;
  planName: string;
  cancelledDate: string;
  reason: 'user_request' | 'non_payment';
  reactivateUrl?: string;
}

export default function SubscriptionCancelledEmail({
  userName = 'Usuário',
  planName = 'Pro',
  cancelledDate = new Date().toLocaleDateString('pt-BR'),
  reason = 'user_request',
  reactivateUrl,
}: SubscriptionCancelledEmailProps) {
  const isUserRequest = reason === 'user_request';

  return (
    <Html>
      <Head />
      <Preview>Assinatura do plano {planName} cancelada</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://ucomis.com/images/logo/uComis_black.png"
            alt="uComis"
            width="120"
            height="40"
            style={logo}
          />
          <Heading style={h1}>
            {isUserRequest ? 'Assinatura Cancelada' : 'Assinatura Cancelada por Não Pagamento'}
          </Heading>
          
          <Text style={text}>Olá {userName},</Text>
          
          {isUserRequest ? (
            <>
              <Text style={text}>
                Confirmamos o cancelamento da sua assinatura do plano <strong>{planName}</strong> em <strong>{cancelledDate}</strong>.
              </Text>

              <Text style={text}>
                Você continuará com acesso ao plano FREE e poderá reativar sua assinatura a qualquer momento.
              </Text>
            </>
          ) : (
            <>
              <Text style={text}>
                Sua assinatura do plano <strong>{planName}</strong> foi cancelada em <strong>{cancelledDate}</strong> devido ao não pagamento.
              </Text>

              <Text style={text}>
                Após 30 dias sem regularização, cancelamos automaticamente sua assinatura. 
                Você ainda pode reativar e voltar a usar o plano {planName}.
              </Text>
            </>
          )}

          <Text style={text}>
            <strong>O que muda agora?</strong><br />
            • Seu acesso volta para o plano FREE<br />
            • Seus dados estão seguros e preservados<br />
            • Você pode reativar a qualquer momento
          </Text>

          {reactivateUrl && (
            <>
              <Text style={text}>
                Sentiremos sua falta! Se mudou de ideia:
              </Text>

              <Link href={reactivateUrl} style={button}>
                Reativar Assinatura
              </Link>
            </>
          )}

          <Text style={footer}>
            Ficou com dúvidas? Responda este email ou entre em contato com nosso suporte.
          </Text>

          <Text style={footer}>
            Atenciosamente,<br />
            Equipe uComis
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 48px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 48px',
  marginBottom: '16px',
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  padding: '12px',
  margin: '24px 48px',
};

const logo = {
  margin: '48px 48px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  padding: '0 48px',
  marginTop: '32px',
};
