import { Header } from './secoes/header';
import { Hero } from './secoes/hero';
import { Problema } from './secoes/problema';
import { Seamless } from './secoes/seamless';
import { Simple } from './secoes/simple';
import { Understandable } from './secoes/understandable';
import { FeaturesShowcase } from './secoes/features-showcase';
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
        <Seamless />
        <Simple />
        <Understandable />
        <FeaturesShowcase />
        <Seguranca />
        <CtaFinal />
      </main>
      <Footer />
    </div>
  );
}
