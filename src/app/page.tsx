import { SiteWrapper } from '@/app/site/secoes/site-wrapper';
import { Header } from '@/app/site/secoes/header';
import { Hero } from '@/app/site/secoes/hero';
import { Problema } from '@/app/site/secoes/problema';
import { Seamless } from '@/app/site/secoes/seamless';
import { Simple } from '@/app/site/secoes/simple';
import { Understandable } from '@/app/site/secoes/understandable';
import { FeaturesShowcase } from '@/app/site/secoes/features-showcase';
import { Seguranca } from '@/app/site/secoes/seguranca';
import { Precos } from '@/app/site/secoes/precos';
import { Faq } from '@/app/site/secoes/faq';
import { CtaFinal } from '@/app/site/secoes/cta-final';
import { Footer } from '@/app/site/secoes/footer';
import { Confidence } from '@/app/site/secoes/confidence';
import { getPlans } from '@/app/actions/billing/plans';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'uComis',
      description: 'Controle de comissões para vendedores. Cadastre vendas, defina regras de comissão e saiba quanto vai receber e quando.',
      url: 'https://ucomis.com',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'BRL',
        lowPrice: '0',
        offerCount: '3',
      },
    },
    {
      '@type': 'Organization',
      name: 'uComis',
      url: 'https://ucomis.com',
      description: 'Controle de comissões para vendedores e representantes comerciais.',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Como saber se minha comissão está certa?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Cadastre suas vendas no uComis com as regras de comissão do fornecedor. O sistema calcula automaticamente quanto você deveria receber, permitindo conferir se os valores batem com o que a empresa pagou.',
          },
        },
        {
          '@type': 'Question',
          name: 'Como funciona o cálculo de comissões?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Você configura as regras de comissão de cada fornecedor (percentuais, faixas, bonificações) e o sistema aplica automaticamente em cada venda cadastrada, gerando o valor de comissão e as parcelas de recebimento.',
          },
        },
        {
          '@type': 'Question',
          name: 'Como calcular comissão de vendas parceladas?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ao cadastrar uma venda, você informa a condição de pagamento (30/60/90 dias, por exemplo). O uComis gera automaticamente as parcelas de comissão com as datas previstas de recebimento.',
          },
        },
        {
          '@type': 'Question',
          name: 'O uComis funciona para quem tem uma só representada?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sim! A maioria dos nossos usuários trabalha com uma empresa. O uComis resolve a dor principal: saber exatamente quanto você vai receber e quando, sem depender da planilha ou da confiança no financeiro.',
          },
        },
        {
          '@type': 'Question',
          name: 'Preciso saber Excel para usar o uComis?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Não. O uComis substitui a planilha. Você cadastra a venda em poucos campos e o sistema faz todo o cálculo. Se você sabe usar WhatsApp, sabe usar o uComis.',
          },
        },
        {
          '@type': 'Question',
          name: 'Meus dados ficam visíveis para a empresa?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Não. O uComis é uma ferramenta pessoal do vendedor. Seus dados são criptografados e só você tem acesso. Nem a gente consegue ver suas informações.',
          },
        },
        {
          '@type': 'Question',
          name: 'Posso ter mais de uma pasta de fornecedor?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sim! No plano Free você tem 1 pasta, no Pro também 1 pasta com recursos extras, e no Ultra você tem pastas ilimitadas para gerenciar todos os seus fornecedores.',
          },
        },
      ],
    },
  ],
}

export default async function LandingPage() {
  const plans = await getPlans();

  return (
    <SiteWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main>
        <Hero />
        <Problema />
        <Seamless />
        <Simple />
        <Understandable />
        <FeaturesShowcase />
        <Seguranca />
        <Confidence />
        <Precos plans={plans} />
        <Faq />
        <CtaFinal />
      </main>
      <Footer />
    </SiteWrapper>
  );
}
