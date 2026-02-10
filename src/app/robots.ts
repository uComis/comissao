import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/faq', '/ajuda', '/privacidade', '/termos'],
        disallow: [
          '/login',
          '/auth/',
          '/onboarding',
          '/reset-password',
          '/home',
          '/dashboard',
          '/minhasvendas',
          '/fornecedores',
          '/recebiveis',
          '/vendas',
          '/vendedores',
          '/regras',
          '/relatorios',
          '/relatorios-vendedor',
          '/configuracoes',
          '/minhaconta',
          '/planos',
          '/admin/',
          '/debug/',
          '/impressao/',
          '/cobrancas',
          '/faturamento',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://ucomis.com.br/sitemap.xml',
  }
}
