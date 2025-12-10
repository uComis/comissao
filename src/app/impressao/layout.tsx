import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Impressão - Comissão.io',
}

export default function ImpressaoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="print-layout min-h-screen bg-white text-black">
      {children}
    </div>
  )
}

