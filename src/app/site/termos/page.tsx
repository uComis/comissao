import { Header } from '../secoes/header';
import { Footer } from '../secoes/footer';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export const metadata = {
  title: 'Termos de Uso | uComis',
  description: 'Termos de Uso do uComis. Condições gerais para uso da plataforma de gestão de comissões.',
};

const LAST_UPDATED = '05 de fevereiro de 2026';

export default function TermosPage() {
  return (
    <div>
      <Header />
      <main className="pt-24">
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="container mx-auto px-6 max-w-[1200px]">
            <ScrollReveal className="text-center max-w-2xl mx-auto">
              <p className="text-landing-primary font-medium mb-4">Legal</p>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight mb-6">
                Termos de Uso
              </h1>
              <p className="text-gray-500 text-sm">Última atualização: {LAST_UPDATED}</p>
            </ScrollReveal>
          </div>
        </section>

        <section className="py-16 sm:py-20 bg-white">
          <div className="container mx-auto px-6 max-w-[800px]">
            <div className="prose prose-gray max-w-none space-y-8">
              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos termos</h2>
                <p className="text-gray-600 leading-relaxed">
                  Ao acessar e utilizar o uComis, você concorda com estes Termos de Uso. Se não concordar com qualquer parte destes termos, não utilize a plataforma. O uso continuado do serviço constitui aceitação de eventuais atualizações destes termos.
                </p>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">2. Descrição do serviço</h2>
                <p className="text-gray-600 leading-relaxed">
                  O uComis é uma plataforma de gestão de comissões para representantes comerciais. O serviço permite cadastrar vendas, calcular comissões automaticamente, consolidar múltiplas pastas de fornecedores e acompanhar recebimentos em um painel centralizado.
                </p>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">3. Cadastro e conta</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Você deve fornecer informações verdadeiras e manter seus dados de acesso em sigilo.</li>
                  <li>Cada conta é pessoal e intransferível.</li>
                  <li>Você é responsável por todas as atividades realizadas em sua conta.</li>
                  <li>Caso identifique uso não autorizado, notifique-nos imediatamente pelo e-mail <a href="mailto:suporte@ucomis.com.br" className="text-landing-primary hover:underline">suporte@ucomis.com.br</a>.</li>
                </ul>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">4. Planos e pagamento</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Free:</strong> acesso gratuito com limitações de funcionalidades conforme descrito na página de preços.</li>
                  <li><strong>Pro e Ultra:</strong> planos pagos com cobrança mensal ou anual, conforme o plano escolhido.</li>
                  <li>Todos os planos pagos incluem 14 dias de teste grátis, sem necessidade de cartão de crédito.</li>
                  <li>O cancelamento pode ser realizado a qualquer momento. Ao cancelar, você mantém acesso até o final do período já pago.</li>
                  <li>Os preços podem ser alterados com aviso prévio de 30 dias.</li>
                </ul>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">5. Uso adequado</h2>
                <p className="text-gray-600 leading-relaxed mb-3">
                  Ao utilizar o uComis, você concorda em:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Utilizar a plataforma apenas para fins legítimos de gestão de comissões.</li>
                  <li>Não tentar acessar áreas restritas ou sistemas internos da plataforma.</li>
                  <li>Não utilizar o serviço para armazenar conteúdo ilegal ou que viole direitos de terceiros.</li>
                  <li>Não realizar engenharia reversa, descompilar ou tentar extrair o código-fonte.</li>
                </ul>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">6. Propriedade intelectual</h2>
                <p className="text-gray-600 leading-relaxed">
                  Todo o conteúdo da plataforma — incluindo marca, logotipo, interface, código e documentação — é de propriedade exclusiva do uComis. Os dados que você insere na plataforma permanecem de sua propriedade. Você nos concede apenas a licença necessária para processar e exibir esses dados conforme o funcionamento do serviço.
                </p>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">7. Disponibilidade do serviço</h2>
                <p className="text-gray-600 leading-relaxed">
                  Nos empenhamos para manter o uComis disponível 24 horas por dia, 7 dias por semana. No entanto, o serviço pode sofrer interrupções para manutenção, atualizações ou por motivos de força maior. Não garantimos disponibilidade ininterrupta e não nos responsabilizamos por perdas decorrentes de indisponibilidade temporária.
                </p>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">8. Limitação de responsabilidade</h2>
                <p className="text-gray-600 leading-relaxed">
                  O uComis é uma ferramenta de apoio à gestão de comissões. Os cálculos são realizados com base nas regras configuradas por você. Não nos responsabilizamos por decisões financeiras tomadas com base nas informações exibidas na plataforma. É sua responsabilidade verificar a exatidão dos dados inseridos e dos resultados apresentados.
                </p>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">9. Encerramento</h2>
                <p className="text-gray-600 leading-relaxed">
                  Podemos suspender ou encerrar sua conta caso haja violação destes Termos de Uso. Você pode encerrar sua conta a qualquer momento. Após o encerramento, seus dados serão mantidos por 30 dias para possível recuperação e, em seguida, excluídos permanentemente.
                </p>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">10. Alterações nos termos</h2>
                <p className="text-gray-600 leading-relaxed">
                  Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Alterações significativas serão comunicadas por e-mail ou aviso na plataforma com antecedência mínima de 15 dias. O uso continuado do serviço após a entrada em vigor das alterações constitui aceitação dos novos termos.
                </p>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">11. Legislação aplicável</h2>
                <p className="text-gray-600 leading-relaxed">
                  Estes Termos de Uso são regidos pela legislação brasileira. Qualquer disputa será resolvida no foro da comarca do domicílio do usuário, conforme previsto no Código de Defesa do Consumidor.
                </p>
              </ScrollReveal>

              <ScrollReveal>
                <h2 className="text-2xl font-semibold mb-4">12. Contato</h2>
                <p className="text-gray-600 leading-relaxed">
                  Para dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail{' '}
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
