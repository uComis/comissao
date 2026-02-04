'use client'

import { Check } from 'lucide-react'

const features = [
  'Self-Custody',
  'Own Your Keys',
  'No Name Required',
  'No Lock-In',
  'Fully Audited',
]

export function Seguranca() {
  return (
    <section id="seguranca" className="py-24 sm:py-32 bg-white">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Content - Left side */}
          <div className="flex-1 space-y-6">
            <p className="text-[#3B82F6] font-medium">Secure</p>

            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              Relentless protection.<br />
              Restful ease.
            </h1>

            <p className="text-gray-600 text-lg leading-relaxed max-w-md">
              Family is fully self-custodial, meaning only you have access to your wallet and its private keys. We have no control over your crypto, nor do we want any.
            </p>

            {/* Features list */}
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#3B82F6]" />
                  <span className="text-[#3B82F6] font-medium text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Placeholder - Right side */}
          <div className="flex-1 flex justify-center items-center">
            <div className="w-full max-w-[500px] h-[400px] bg-gray-100 rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
