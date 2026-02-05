import { Header } from '../secoes/header';
import { Footer } from '../secoes/footer';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export const metadata = {
  title: 'Política de Privacidade | uComis',
  description: 'Política de Privacidade do uComis. Saiba como coletamos, usamos e protegemos seus dados.',
};

const LAST_UPDATED = '05 de fevereiro de 2026';

export default function PrivacidadePage() {
  return (
    <div>
      <Header />
      <main className="pt-24">
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="container mx-auto px-6 max-w-[1200px]">
            <ScrollReveal className="text-center max-w-2xl mx-auto">
              <p className="text-landing-primary font-medium mb-4">Legal</p>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight mb-6">
                Política de Privacidade
              </h1>
              <p className="text-gray-500 text-sm">Última atualização: {LAST_UPDATED}</p>
            </ScrollReveal>
          </div>
        </section>

        <section className="py-16 sm:py-20 bg-white">
          <div className="container mx-auto px-6 max-w-[800px]">
            <div className="prose prose-gray max-w-none space-y-8">
              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">1. Informações que coletamos</h2>
                <p className="text-gray-600 leading-relaxed mb-3">
                  Ao utilizar o uComis, coletamos as seguintes informações:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Dados de cadastro:</strong> nome, e-mail e informações de autenticação fornecidas via Google Sign-In.</li>
                  <li><strong>Dados de uso:</strong> informações sobre vendas, comissões, fornecedores e pastas cadastradas por você na plataforma.</li>
                  <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador, sistema operacional e dados de navegação para fins de segurança e melhoria do serviço.</li>
                </ul>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">2. Como usamos suas informações</h2>
                <p className="text-gray-600 leading-relaxed mb-3">
                  Utilizamos suas informações exclusivamente para:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Fornecer, manter e melhorar os serviços do uComis.</li>
                  <li>Calcular e exibir suas comissões e relatórios financeiros.</li>
                  <li>Enviar comunicações essenciais sobre o serviço (atualizações, segurança, suporte).</li>
                  <li>Garantir a segurança da plataforma e prevenir fraudes.</li>
                </ul>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">3. Armazenamento e segurança</h2>
                <p className="text-gray-600 leading-relaxed mb-3">
                  Seus dados são armazenados em infraestrutura segura fornecida pela Supabase, com as seguintes proteções:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Criptografia AES-256 para dados em repouso.</li>
                  <li>Criptografia TLS/SSL para dados em trânsito.</li>
                  <li>Infraestrutura certificada SOC 2 Type 2.</li>
                  <li>Acesso restrito — nem a equipe do uComis tem acesso aos seus dados financeiros.</li>
                </ul>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">4. Compartilhamento de dados</h2>
                <p className="text-gray-600 leading-relaxed">
                  Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais. Seus dados podem ser compartilhados apenas nas seguintes situações:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 mt-3">
                  <li>Com provedores de infraestrutura essenciais para o funcionamento do serviço (Supabase, Vercel).</li>
                  <li>Quando exigido por lei ou ordem judicial.</li>
                </ul>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">5. Seus direitos</h2>
                <p className="text-gray-600 leading-relaxed mb-3">
                  De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Acessar os dados pessoais que mantemos sobre você.</li>
                  <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
                  <li>Solicitar a exclusão dos seus dados pessoais.</li>
                  <li>Revogar o consentimento a qualquer momento.</li>
                  <li>Solicitar a portabilidade dos seus dados.</li>
                </ul>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">6. Cookies</h2>
                <p className="text-gray-600 leading-relaxed">
                  Utilizamos cookies essenciais para manter sua sessão autenticada e garantir o funcionamento da plataforma. Não utilizamos cookies de rastreamento ou publicidade.
                </p>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">7. Alterações nesta política</h2>
                <p className="text-gray-600 leading-relaxed">
                  Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre alterações significativas por e-mail ou por aviso na plataforma. O uso continuado do serviço após as alterações constitui aceitação da nova política.
                </p>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">8. Contato</h2>
                <p className="text-gray-600 leading-relaxed">
                  Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato pelo e-mail{' '}
                  <a href="mailto:suporte@ucomis.com.br" className="text-landing-primary hover:underline">
                    suporte@ucomis.com.br
                  </a>.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
