import type { Metadata } from 'next'
import { inter } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'Impressão - Comissão.io',
}

export default function ImpressaoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${inter.variable} print-layout min-h-screen bg-white text-black`}>
      {children}
    </div>
  )
}

