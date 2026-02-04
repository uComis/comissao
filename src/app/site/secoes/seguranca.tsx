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
            <p className="text-[#C9A227] font-medium">Secure</p>

            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              Relentless protection.<br />
              <span className="text-gray-400">Restful ease.</span>
            </h1>

            <p className="text-gray-600 text-lg leading-relaxed max-w-md">
              Family is fully self-custodial, meaning only you have access to your wallet and its private keys. We have no control over your crypto, nor do we want any.
            </p>

            {/* Features list */}
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#C9A227]" />
                  <span className="text-[#C9A227] font-medium text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Security Animation - Right side */}
          <div className="flex-1 flex justify-center items-center">
            <div className="w-full max-w-[500px] h-[400px]">
              <SecurityAnimation />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SecurityAnimation() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 300"
      className="w-full h-full"
    >
      <defs>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="serverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>

      <style>
        {`
          .path-animate {
            stroke-dasharray: 8;
            animation: dash 20s linear infinite;
          }
          @keyframes dash {
            to {
              stroke-dashoffset: 200;
            }
          }
          .float {
            animation: float 3s ease-in-out infinite;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          .pulse {
            animation: pulse 2s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}
      </style>

      {/* Background lines */}
      <g className="path-animate" stroke="#e2e8f0" strokeWidth="1" fill="none">
        <path d="M50,150 Q150,100 200,150 T350,150" />
        <path d="M50,180 Q150,130 200,180 T350,180" />
        <path d="M50,120 Q150,70 200,120 T350,120" />
      </g>

      {/* Data flow lines */}
      <g className="path-animate" stroke="#22c55e" strokeWidth="2" fill="none" opacity="0.6">
        <path d="M80,200 L150,150 L200,150" />
        <path d="M320,200 L250,150 L200,150" />
        <path d="M200,50 L200,150" />
      </g>

      {/* Left server */}
      <g className="float" style={{ animationDelay: '0s' }}>
        <rect x="50" y="180" width="60" height="80" rx="4" fill="url(#serverGradient)" />
        <rect x="58" y="190" width="44" height="6" rx="2" fill="#22c55e" className="pulse" />
        <rect x="58" y="202" width="44" height="6" rx="2" fill="#f59e0b" className="pulse" style={{ animationDelay: '0.5s' }} />
        <rect x="58" y="214" width="44" height="6" rx="2" fill="#22c55e" className="pulse" style={{ animationDelay: '1s' }} />
        <rect x="58" y="226" width="44" height="6" rx="2" fill="#ef4444" className="pulse" style={{ animationDelay: '1.5s' }} />
        <rect x="58" y="238" width="44" height="6" rx="2" fill="#22c55e" className="pulse" style={{ animationDelay: '0.3s' }} />
      </g>

      {/* Right server */}
      <g className="float" style={{ animationDelay: '1s' }}>
        <rect x="290" y="180" width="60" height="80" rx="4" fill="url(#serverGradient)" />
        <rect x="298" y="190" width="44" height="6" rx="2" fill="#22c55e" className="pulse" style={{ animationDelay: '0.2s' }} />
        <rect x="298" y="202" width="44" height="6" rx="2" fill="#22c55e" className="pulse" style={{ animationDelay: '0.7s' }} />
        <rect x="298" y="214" width="44" height="6" rx="2" fill="#f59e0b" className="pulse" style={{ animationDelay: '1.2s' }} />
        <rect x="298" y="226" width="44" height="6" rx="2" fill="#22c55e" className="pulse" style={{ animationDelay: '0.1s' }} />
        <rect x="298" y="238" width="44" height="6" rx="2" fill="#ef4444" className="pulse" style={{ animationDelay: '0.8s' }} />
      </g>

      {/* Central Shield */}
      <g className="float" style={{ animationDelay: '0.5s' }}>
        <path
          d="M200,60 L240,80 L240,130 C240,160 200,190 200,190 C200,190 160,160 160,130 L160,80 Z"
          fill="url(#shieldGradient)"
          stroke="#16a34a"
          strokeWidth="2"
        />
        {/* Checkmark inside shield */}
        <path
          d="M180,125 L195,140 L225,105"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* Top cloud/server */}
      <g className="float" style={{ animationDelay: '1.5s' }}>
        <ellipse cx="200" cy="35" rx="40" ry="20" fill="#e2e8f0" />
        <rect x="185" y="25" width="30" height="20" rx="2" fill="#64748b" />
        <circle cx="193" cy="35" r="3" fill="#22c55e" className="pulse" />
        <circle cx="207" cy="35" r="3" fill="#22c55e" className="pulse" style={{ animationDelay: '0.5s' }} />
      </g>

      {/* Floating data particles */}
      <g>
        <circle cx="130" cy="130" r="4" fill="#22c55e" className="pulse" />
        <circle cx="270" cy="130" r="4" fill="#22c55e" className="pulse" style={{ animationDelay: '0.3s' }} />
        <circle cx="150" cy="100" r="3" fill="#f59e0b" className="pulse" style={{ animationDelay: '0.6s' }} />
        <circle cx="250" cy="100" r="3" fill="#f59e0b" className="pulse" style={{ animationDelay: '0.9s' }} />
        <circle cx="200" cy="220" r="4" fill="#ef4444" className="pulse" style={{ animationDelay: '1.2s' }} />
      </g>

      {/* Connection dots */}
      <circle cx="200" cy="150" r="6" fill="#22c55e" className="pulse" />
      <circle cx="150" cy="150" r="4" fill="#64748b" />
      <circle cx="250" cy="150" r="4" fill="#64748b" />
    </svg>
  )
}
