import { Header } from './secoes/header';
import { Hero } from './secoes/hero';
import { Problema } from './secoes/problema';
import { FeaturesShowcase } from './secoes/features-showcase';
import { Metodologia } from './secoes/metodologia';
import { Kai } from './secoes/kai';
import { Seguranca } from './secoes/seguranca';
import { CtaFinal } from './secoes/cta-final';
import { Footer } from './secoes/footer';

export default function SitePage() {
  return (
    <div className="">
      <Header />
      <main>
        <Hero />
        <Problema />
        <FeaturesShowcase />
        <Metodologia />
        <Kai />
        <Seguranca />
        <CtaFinal />
      </main>
      <Footer />
    </div>
  );
}
