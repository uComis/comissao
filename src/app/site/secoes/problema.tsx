import { Card, CardContent } from '@/components/ui/card';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  ShieldX,
  Shield,
  Zap,
  Lock,
  Database,
  FileCheck
} from 'lucide-react';

const PROBLEMAS_EXCEL = [
  {
    icon: FileSpreadsheet,
    texto: 'Fórmulas quebradas e dados perdidos',
  },
  {
    icon: Clock,
    texto: 'Horas de trabalho manual duplicado',
  },
  {
    icon: AlertTriangle,
    texto: 'Impossível confiar nos resultados',
  },
  {
    icon: ShieldX,
    texto: 'Zero segurança e privacidade',
  },
];

const BENEFICIOS_UCOMIS = [
  {
    icon: Shield,
    texto: 'Dados sempre protegidos e acessíveis',
  },
  {
    icon: Zap,
    texto: 'Auditoria automática em tempo real',
  },
  {
    icon: FileCheck,
    texto: '100% confiável e verificado',
  },
  {
    icon: Lock,
    texto: 'LGPD compliant e criptografado',
  },
];

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
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-7xl mx-auto space-y-20">
          {/* Header */}
          <div className="text-center space-y-6 max-w-3xl mx-auto">
              <h2 className="text-5xl lg:text-6xl font-bold tracking-tight">
                Você não deveria ter que auditar o {' '}
                <span className="bg-gradient-to-r from-landing-gradient-start to-landing-gradient-end bg-clip-text text-transparent">
                  próprio financeiro
                </span>
              </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Vendedores gastam horas tentando auditar vendas em planilhas manuais, 
              complexas e, no final, <strong className="font-semibold">sempre falham</strong>. Não faça do controle um <strong className="font-semibold">segundo emprego</strong> não remunerado: <strong className="font-semibold bg-gradient-to-r from-landing-gradient-start to-landing-gradient-end bg-clip-text text-transparent">poupe tempo</strong> e foque no que realmente importa — suas vendas.
            </p>
          </div>

          {/* Comparativo Refinado */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Excel - Design Neutro e Sofisticado */}
            <Card className="relative overflow-hidden border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-slate-200/50 transition-colors" />
              
              <CardContent className="p-10 space-y-8 relative">
                {/* Header */}
                <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
                    <FileSpreadsheet className="w-7 h-7 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Planilhas Manuais</h3>
                    <p className="text-sm text-slate-500">Método tradicional</p>
                  </div>
                </div>

                {/* Problemas */}
                <ul className="space-y-5">
                  {PROBLEMAS_EXCEL.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <li key={index} className="flex items-start gap-4 group/item">
                        <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 border border-slate-200 group-hover/item:bg-slate-200 transition-colors">
                          <Icon className="w-4 h-4 text-slate-500" />
                        </div>
                        <span className="text-slate-700 leading-relaxed pt-1 flex-1">
                          {item.texto}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* Footer */}
                <div className="pt-6 border-t border-slate-200">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100/80 border border-slate-200">
                    <AlertTriangle className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Alto risco de erro</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* uComis - Design Premium com Gradiente Sutil */}
            <Card className="relative overflow-hidden border-2 border-landing-primary/20 bg-gradient-to-br from-white via-landing-primary/5 to-landing-gradient-end/5 shadow-xl hover:shadow-2xl transition-all duration-500 group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-landing-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-landing-primary/30 transition-all duration-500" />
              
              <CardContent className="p-10 space-y-8 relative">
                {/* Header */}
                <div className="flex items-center gap-4 pb-6 border-b border-landing-primary/20">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-landing-primary/10 to-landing-gradient-end/10 border border-landing-primary/30 shadow-sm">
                    <Database className="w-7 h-7 text-landing-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-landing-primary to-landing-gradient-end bg-clip-text text-transparent">
                      uComis
                    </h3>
                    <p className="text-sm text-muted-foreground">Solução profissional</p>
                  </div>
                </div>

                {/* Benefícios */}
                <ul className="space-y-5">
                  {BENEFICIOS_UCOMIS.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <li key={index} className="flex items-start gap-4 group/item">
                        <div className="mt-0.5 p-1.5 rounded-lg bg-landing-primary/10 border border-landing-primary/20 group-hover/item:bg-landing-primary/20 transition-colors">
                          <Icon className="w-4 h-4 text-landing-primary" />
                        </div>
                        <span className="text-foreground leading-relaxed pt-1 flex-1 font-medium">
                          {item.texto}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* Footer */}
                <div className="pt-6 border-t border-landing-primary/20">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-landing-primary/10 to-landing-gradient-end/10 border border-landing-primary/30">
                    <CheckCircle2 className="w-4 h-4 text-landing-primary" />
                    <span className="text-sm font-semibold text-landing-primary">100% auditado</span>
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
