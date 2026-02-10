import { ScrollReveal } from '@/components/ui/scroll-reveal'

export function Problema() {
  return (
    <section className="pt-16 sm:pt-24 pb-10 sm:pb-16 bg-white">
      <div className="container mx-auto px-6 max-w-[1200px]">
        {/* Header */}
        <ScrollReveal className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-wide">
            Comissão errada, estorno indevido, desconto fantasma — {' '}
            <span className="bg-gradient-to-r from-landing-gradient-start via-landing-gradient-middle to-landing-gradient-end bg-clip-text text-transparent">
              e você conferindo na planilha
            </span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Horas perdidas conferindo comissão em planilha. Erros que custam dinheiro.
            <br />
            <strong className="font-semibold">Não faça do controle de comissões um segundo emprego {' '}
              <span className="bg-gradient-to-r from-landing-gradient-start via-landing-gradient-middle to-landing-gradient-end bg-clip-text text-transparent">
                não remunerado
              </span>. Foque nas vendas.
            </strong>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
