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

interface AccountSuspendedEmailProps {
  userName: string;
  planName: string;
  suspendedDate: string;
  reactivateUrl: string;
}

export default function AccountSuspendedEmail({
  userName = 'Usuário',
  planName = 'Pro',
  suspendedDate = new Date().toLocaleDateString('pt-BR'),
  reactivateUrl = '#',
}: AccountSuspendedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Sua conta uComis foi suspensa</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://ucomis.com/images/logo/uComis_black.png"
            alt="uComis"
            width="120"
            height="40"
            style={logo}
          />
          <Heading style={h1}>Conta Suspensa</Heading>
          
          <Text style={text}>Olá {userName},</Text>
          
          <Text style={text}>
            Sua conta foi suspensa em <strong>{suspendedDate}</strong> devido ao não pagamento do plano <strong>{planName}</strong>.
          </Text>

          <Text style={text}>
            <strong>O que isso significa?</strong><br />
            Seu acesso às funcionalidades do plano {planName} foi temporariamente desativado. 
            Você ainda pode acessar o sistema no plano FREE.
          </Text>

          <Text style={text}>
            Para reativar seu plano {planName}, regularize o pagamento:
          </Text>

          <Link href={reactivateUrl} style={button}>
            Reativar Plano
          </Link>

          <Text style={warning}>
            ⚠️ Após 30 dias sem pagamento, sua assinatura será cancelada automaticamente.
          </Text>

          <Text style={footer}>
            Precisa de ajuda? Entre em contato com nosso suporte.
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

const warning = {
  color: '#e74c3c',
  fontSize: '14px',
  fontWeight: 'bold',
  lineHeight: '22px',
  padding: '16px 48px',
  backgroundColor: '#fff3cd',
  borderLeft: '4px solid #e74c3c',
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
