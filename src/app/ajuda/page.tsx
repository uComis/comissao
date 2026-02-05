import { SiteWrapper } from '@/app/site/secoes/site-wrapper';
import { Header } from '@/app/site/secoes/header';
import { Footer } from '@/app/site/secoes/footer';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export const metadata = {
  title: 'Ajuda | uComis',
  description: 'Central de ajuda do uComis. Tutoriais e guias para usar a plataforma.',
};

export default function AjudaPage() {
  return (
    <SiteWrapper>
      <Header />
      <main className="pt-24">
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="container mx-auto px-6 max-w-[1200px]">
            <ScrollReveal className="text-center max-w-2xl mx-auto">
              <p className="text-landing-primary font-medium mb-4">Central de Ajuda</p>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight mb-6">
                Como podemos ajudar?
              </h1>
            </ScrollReveal>
          </div>
        </section>

        <section className="py-16 sm:py-20 bg-white">
          <div className="container mx-auto px-6 max-w-[1200px]">
            <ScrollReveal className="text-center">
              <div className="bg-landing-primary/5 rounded-2xl p-8 max-w-2xl mx-auto">
                <p className="text-gray-600 mb-4">
                  Estamos preparando tutoriais detalhados para cada tópico.
                </p>
                <p className="text-gray-600">
                  Enquanto isso, se tiver alguma dúvida, entre em contato pelo{' '}
                  <a href="mailto:suporte@ucomis.com.br" className="text-landing-primary hover:underline">
                    suporte@ucomis.com.br
                  </a>
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </SiteWrapper>
  );
}
