import { Header } from './secoes/header';
import { Hero } from './secoes/hero';
import { Problema } from './secoes/problema';
import { Seamless } from './secoes/seamless';
import { Simple } from './secoes/simple';
import { Understandable } from './secoes/understandable';
import { FeaturesShowcase } from './secoes/features-showcase';
import { Seguranca } from './secoes/seguranca';
import { Precos } from './secoes/precos';
import { Faq } from './secoes/faq';
import { CtaFinal } from './secoes/cta-final';
import { Footer } from './secoes/footer';
import { getPlans } from '@/app/actions/billing/plans';

export default async function SitePage() {
  const plans = await getPlans();

  return (
    <div className="">
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
    </div>
  );
}
