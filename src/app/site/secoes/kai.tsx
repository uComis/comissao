export function Kai() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <div>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Texto */}
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-wide">
                Dê um oi para o{' '}
                <span className="bg-gradient-to-r from-landing-gradient-start to-landing-gradient-end bg-clip-text text-transparent">
                  Kai
                </span>
              </h2>

              <p className="text-xl text-muted-foreground">
                Seu assistente pessoal de comissões.
              </p>

              <div className="space-y-4 text-lg">
                <p>
                  Sem campos obrigatórios. Sem burocracia. O Kai entende seu
                  ritmo e organiza tudo para você.
                </p>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-landing-primary/10 border border-landing-primary/20">
                  <div className="text-2xl">✨</div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Fricção Zero
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cole um texto do WhatsApp e deixe o Kai fazer o resto
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Placeholder de Vídeo Screencast */}
            <div className="relative">
              <div className="aspect-[9/16] max-w-sm mx-auto rounded-3xl bg-gradient-to-br from-landing-gradient-start to-landing-gradient-end flex items-center justify-center text-center p-8 shadow-2xl">
                <div className="text-white space-y-3">
                  <div className="text-sm font-bold uppercase tracking-wider">
                    🎬 VÍDEO
                  </div>
                  <div className="text-base font-medium">
                    Screencast Mobile
                  </div>
                  <div className="text-sm opacity-90">
                    5-8 segundos
                    <br />
                    <br />
                    Usuário cola texto do WhatsApp
                    <br />
                    ↓<br />
                    Agente Kai gera automaticamente
                    <br />
                    card de comissão pronto para salvar
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
