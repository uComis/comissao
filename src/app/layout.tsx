import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Providers } from '@/components/layout/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'uComis — Controle de Comissões para Vendedores',
  description: 'Cadastre suas vendas, defina regras de comissão e saiba exatamente quanto vai receber e quando. Dashboard consolidado e timeline de parcelas 30/60/90.',
  openGraph: {
    title: 'uComis — Controle de Comissões para Vendedores',
    description: 'Cadastre suas vendas, defina regras de comissão e saiba exatamente quanto vai receber e quando.',
    url: 'https://ucomis.com',
    siteName: 'uComis',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'uComis — Controle de Comissões para Vendedores',
    description: 'Saiba exatamente quanto vai receber de comissão e quando.',
  },
  alternates: {
    canonical: 'https://ucomis.com',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head />
      <body className={`${GeistSans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
