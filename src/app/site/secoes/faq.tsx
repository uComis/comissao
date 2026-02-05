'use client'

import { FaqSection } from '@/components/faq'

export function Faq() {
  return (
    <section id="faq" className="py-20 sm:py-24 bg-white">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <FaqSection
          variant="landing"
          title="Perguntas Frequentes"
          subtitle="Tire suas dúvidas sobre a plataforma."
        />
      </div>
    </section>
  )
}
