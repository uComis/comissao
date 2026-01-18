export function Problema() {
  return (
    <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
      {/* Gradiente radial saindo do centro */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none" style={{ height: '100%' }}>
        <div 
          className="w-full max-w-4xl h-full rounded-full blur-2xl" 
          style={{
            background: 'radial-gradient(ellipse at center, rgba(229, 231, 235, 1) 0%, rgba(243, 244, 246, 0.7) 35%, rgba(249, 250, 251, 0.4) 60%, transparent 85%)'
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10 max-w-[1200px]">
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
            <strong className="font-semibold">Não faça do controle um segundo emprego não remunerado.</strong>
          </p>
        </div>
      </div>
    </section>
  );
}
