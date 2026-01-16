import { Card, CardContent } from '@/components/ui/card';
import { XCircle, CheckCircle2 } from 'lucide-react';

export function Problema() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Título */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Chega de ser o próprio{' '}
              <span className="text-landing-primary">financeiro.</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Vendedores perdem horas mantendo planilhas paralelas por
              desconfiança. É o chamado &quot;shadow accounting&quot;. O uComis
              devolve esse tempo para você focar no que importa:{' '}
              <span className="font-semibold text-foreground">vender</span>.
            </p>
          </div>

          {/* Comparativo Lado a Lado */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Excel */}
            <Card className="border-2 border-destructive/20 bg-destructive/5">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-destructive" />
                  <h3 className="text-2xl font-bold text-destructive">
                    Excel
                  </h3>
                </div>

                <ul className="space-y-4 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-destructive/50 rounded-full mt-2 flex-shrink-0" />
                    <span>Fórmulas quebradas e dados perdidos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-destructive/50 rounded-full mt-2 flex-shrink-0" />
                    <span>Horas de trabalho manual duplicado</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-destructive/50 rounded-full mt-2 flex-shrink-0" />
                    <span>Impossível confiar nos resultados</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-destructive/50 rounded-full mt-2 flex-shrink-0" />
                    <span>Zero segurança e privacidade</span>
                  </li>
                </ul>

                <div className="pt-4 border-t border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive font-semibold">
                    <XCircle className="w-5 h-5" />
                    <span>Risco de Erro</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* uComis */}
            <Card className="border-2 border-landing-primary/30 bg-landing-primary/5 shadow-lg">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-landing-primary" />
                  <h3 className="text-2xl font-bold text-landing-primary">
                    uComis
                  </h3>
                </div>

                <ul className="space-y-4 text-foreground">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-landing-primary flex-shrink-0 mt-0.5" />
                    <span>Dados sempre protegidos e acessíveis</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-landing-primary flex-shrink-0 mt-0.5" />
                    <span>Auditoria automática em tempo real</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-landing-primary flex-shrink-0 mt-0.5" />
                    <span>100% confiável e verificado</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-landing-primary flex-shrink-0 mt-0.5" />
                    <span>LGPD compliant e criptografado</span>
                  </li>
                </ul>

                <div className="pt-4 border-t border-landing-primary/20">
                  <div className="flex items-center gap-2 text-landing-primary font-semibold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Auditado</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
