import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lock, Database, Eye, FileLock, KeyRound } from 'lucide-react';

const RECURSOS_SEGURANCA = [
  {
    icon: Shield,
    titulo: 'LGPD Compliant',
    descricao: '100% em conformidade com a Lei Geral de Proteção de Dados',
    cor: 'from-blue-500/10 to-blue-600/10',
    corIcone: 'text-blue-600',
    corBorda: 'border-blue-200',
  },
  {
    icon: Lock,
    titulo: 'Criptografia AES-256',
    descricao: 'Nível bancário de segurança para proteger seus dados',
    cor: 'from-emerald-500/10 to-emerald-600/10',
    corIcone: 'text-emerald-600',
    corBorda: 'border-emerald-200',
  },
  {
    icon: Database,
    titulo: 'Dados Privados',
    descricao: 'Suas informações pertencem exclusivamente a você',
    cor: 'from-purple-500/10 to-purple-600/10',
    corIcone: 'text-purple-600',
    corBorda: 'border-purple-200',
  },
  {
    icon: Eye,
    titulo: 'Zero Acesso Não Autorizado',
    descricao: 'Empresas e terceiros não podem ver seus dados sem permissão',
    cor: 'from-orange-500/10 to-orange-600/10',
    corIcone: 'text-orange-600',
    corBorda: 'border-orange-200',
  },
  {
    icon: FileLock,
    titulo: 'Backup Automático',
    descricao: 'Seus dados são protegidos com cópias de segurança constantes',
    cor: 'from-indigo-500/10 to-indigo-600/10',
    corIcone: 'text-indigo-600',
    corBorda: 'border-indigo-200',
  },
  {
    icon: KeyRound,
    titulo: 'Autenticação Forte',
    descricao: 'Múltiplas camadas de verificação para proteger sua conta',
    cor: 'from-red-500/10 to-red-600/10',
    corIcone: 'text-red-600',
    corBorda: 'border-red-200',
  },
];

export function Seguranca() {
  return (
    <section id="seguranca" className="py-32 bg-background relative overflow-hidden">
      {/* Background decorativo sutil */}
      <div className="absolute inset-0 bg-gradient-to-b from-landing-primary/3 via-transparent to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10 max-w-[1200px]">
        <div className="space-y-20">
          {/* Header */}
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            
            <h2 className="text-5xl lg:text-6xl font-bold tracking-tight">
              Seus dados{' '}
              <span className="bg-gradient-to-r from-landing-primary to-landing-gradient-end bg-clip-text text-transparent">
                totalmente protegidos
              </span>
            </h2>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Seu histórico de vendas e conquistas pertence exclusivamente a você. 
              Nenhuma empresa, empregador ou terceiro pode acessar suas informações.
            </p>
          </div>

          {/* Card Principal de Proteção */}
          <Card className="border-2 border-landing-primary/30 bg-gradient-to-br from-landing-primary/5 via-landing-primary/3 to-transparent shadow-xl hover:shadow-2xl transition-all duration-500 group">
            <CardContent className="p-12 lg:p-16">
              <div className="grid lg:grid-cols-[auto_1fr] gap-8 items-start">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-landing-primary/20 to-landing-gradient-end/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                  <div className="relative p-6 rounded-2xl bg-gradient-to-br from-landing-primary/10 to-landing-gradient-end/10 border-2 border-landing-primary/30">
                    <Shield className="w-12 h-12 text-landing-primary" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-3xl lg:text-4xl font-bold">Proteção Total Garantida</h3>
                    <div className="px-3 py-1 rounded-full bg-green-100 border border-green-200">
                      <span className="text-sm font-semibold text-green-700">Verificado</span>
                    </div>
                  </div>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                    Implementamos múltiplas camadas de segurança para garantir que seus dados 
                    estejam sempre protegidos. Criptografia de ponta a ponta, conformidade total 
                    com LGPD e políticas de privacidade rigorosas que colocam você no controle.
                  </p>
                  
                  <div className="flex flex-wrap gap-3 pt-2">
                    <div className="px-4 py-2 rounded-lg bg-white/60 backdrop-blur-sm border border-landing-primary/20">
                      <span className="text-sm font-medium">Auditoria Independente</span>
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-white/60 backdrop-blur-sm border border-landing-primary/20">
                      <span className="text-sm font-medium">Certificação ISO 27001</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid de Recursos de Segurança */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RECURSOS_SEGURANCA.map((recurso, index) => {
              const Icon = recurso.icon;
              return (
                <Card
                  key={index}
                  className={`group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border ${recurso.corBorda} bg-gradient-to-br ${recurso.cor} hover:border-opacity-60`}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/80 backdrop-blur-sm border ${recurso.corBorda} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-6 h-6 ${recurso.corIcone}`} />
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold text-foreground">
                        {recurso.titulo}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {recurso.descricao}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Footer informativo */}
          <div className="text-center pt-8">
            <p className="text-sm text-muted-foreground">
              Todos os dados são armazenados em servidores certificados e monitorados 24/7
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
