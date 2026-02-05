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
import { getPlans } from '@/app/actions/billing/plans';

export default async function LandingPage() {
  const plans = await getPlans();

  return (
    <SiteWrapper>
      <Header />
      <main>
        <Hero />
        <Problema />
        <Seamless />
        <Simple />
        <Understandable />
        <FeaturesShowcase />
        <Seguranca />
        <Precos plans={plans} />
        <Faq />
        <CtaFinal />
      </main>
      <Footer />
    </SiteWrapper>
  );
}
