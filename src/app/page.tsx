import { Header } from './site/secoes/header';
import { Hero } from './site/secoes/hero';
import { Problema } from './site/secoes/problema';
import { FeaturesShowcase } from './site/secoes/features-showcase';
import { Metodologia } from './site/secoes/metodologia';
// import { Kai } from './site/secoes/kai';
import { Seguranca } from './site/secoes/seguranca';
import { CtaFinal } from './site/secoes/cta-final';
import { Footer } from './site/secoes/footer';

export default function HomePage() {
  return (
    <div className="">
      <Header />
      <main>
        <Hero />
        <Problema />
        <FeaturesShowcase />
        <Metodologia />
        {/* <Kai /> */}
        <Seguranca />
        <CtaFinal />
      </main>
      <Footer />
    </div>
  );
}
