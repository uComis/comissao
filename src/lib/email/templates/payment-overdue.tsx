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

interface PaymentOverdueEmailProps {
  userName: string;
  planName: string;
  daysOverdue: number;
  amount: number;
  paymentUrl: string;
}

export default function PaymentOverdueEmail({
  userName = 'Usuário',
  planName = 'Pro',
  daysOverdue = 0,
  amount = 29.90,
  paymentUrl = '#',
}: PaymentOverdueEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Pagamento do plano {planName} em atraso</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://ucomis.com/images/logo/uComis_black.png"
            alt="uComis"
            width="120"
            height="40"
            style={logo}
          />
          <Heading style={h1}>Pagamento em Atraso</Heading>
          
          <Text style={text}>Olá {userName},</Text>
          
          <Text style={text}>
            Identificamos que o pagamento do seu plano <strong>{planName}</strong> não foi confirmado.
          </Text>

          <Text style={text}>
            <strong>Valor:</strong> R$ {amount.toFixed(2)}<br />
            {daysOverdue > 0 && <><strong>Dias em atraso:</strong> {daysOverdue}<br /></>}
          </Text>

          <Text style={text}>
            Para evitar a suspensão da sua conta, regularize o pagamento em até 2 dias.
          </Text>

          <Link href={paymentUrl} style={button}>
            Pagar Agora
          </Link>

          <Text style={footer}>
            Se você já pagou, desconsidere este email. O processamento pode levar algumas horas.
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
