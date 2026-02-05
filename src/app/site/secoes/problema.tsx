export function Problema() {
  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className="container mx-auto px-6 max-w-[1200px]">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-wide">
            Você não deveria ter que auditar o {' '}
            <span className="bg-gradient-to-r from-landing-gradient-start via-landing-gradient-middle to-landing-gradient-end bg-clip-text text-transparent">
              próprio financeiro
            </span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Horas perdidas em planilhas manuais. Erros que custam dinheiro.
            <br />
            <strong className="font-semibold">Não faça do controle um segundo emprego {' '}
              <span className="bg-gradient-to-r from-landing-gradient-start via-landing-gradient-middle to-landing-gradient-end bg-clip-text text-transparent">
                não remunerado
              </span>.
            </strong>
          </p>
        </div>
      </div>
    </section>
  );
}
