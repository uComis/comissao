import { Lock, ShieldCheck, EyeOff } from 'lucide-react'

const securityCards = [
  {
    icon: Lock,
    title: 'Criptografia',
    description: 'Seus dados são criptografados com padrão bancário (AES-256).',
  },
  {
    icon: ShieldCheck,
    title: 'Auditado',
    description: 'Infraestrutura certificada SOC 2 Type 2, auditada anualmente.',
  },
  {
    icon: EyeOff,
    title: 'Acesso restrito',
    description: 'Só você vê seus dados. Nem a gente tem acesso.',
  },
]

export function Seguranca() {
  return (
    <section id="seguranca" className="py-20 sm:py-24 bg-white">
      <div className="container mx-auto px-6 max-w-[1200px]">
        {/* Header centralizado */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-[#3B82F6] font-medium mb-4">Seguro</p>

          <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight mb-6">
            Seus dados protegidos.<br />
            Sua paz garantida.
          </h1>

          <p className="text-gray-600 text-lg leading-relaxed">
            Usamos a mesma infraestrutura de segurança de grandes empresas de tecnologia.
            Seus dados estão criptografados e protegidos 24 horas por dia.
          </p>
        </div>

        {/* Cards de segurança */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {securityCards.map((card) => (
            <div
              key={card.title}
              className="bg-gray-50 rounded-2xl p-8 text-center"
            >
              <div className="w-14 h-14 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center mx-auto mb-5">
                <card.icon className="w-7 h-7 text-[#3B82F6]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{card.title}</h3>
              <p className="text-gray-600 leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
