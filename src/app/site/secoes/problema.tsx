export function Problema() {
  return (
    <section className="py-32 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
      {/* Elementos decorativos sutis */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />
      </div>

      <div className="container mx-auto px-6 relative z-10 max-w-[1200px]">
        {/* Header */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h2 className="text-5xl lg:text-6xl font-bold tracking-tight">
            Você não deveria ter que auditar o {' '}
            <span className="bg-gradient-to-r from-landing-gradient-start to-landing-gradient-end bg-clip-text text-transparent">
              próprio financeiro
            </span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Horas perdidas em planilhas manuais. Erros que custam dinheiro.{' '}
            <strong className="font-semibold">Não faça do controle um segundo emprego não remunerado.</strong>
          </p>
        </div>
      </div>
    </section>
  );
}
