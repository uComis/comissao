type RouteConfig = {
  title: string
  backHref?: string
}

export const routeConfigs: Record<string, RouteConfig> = {
  '/': { title: 'Dashboard' },
  '/dashboard': { title: 'Dashboard' },
  '/home': { title: 'Dashboard' },
  '/recebiveis': { title: 'Faturamento' },
  '/clientes': { title: 'Meus Clientes' },
  '/minhasvendas': { title: 'Minhas Vendas' },
  '/minhasvendas/nova': { title: 'Registro de venda', backHref: '/minhasvendas' },
  '/fornecedores': { title: 'Minhas Pastas' },
  '/fornecedores/novo': { title: 'Nova Pasta', backHref: '/fornecedores' },
  '/vendedores': { title: 'Vendedores' },
  '/vendas': { title: 'Vendas' },
  '/regras': { title: 'Regras de Comissão' },
  '/relatorios': { title: 'Relatórios' },
  '/relatorios-vendedor': { title: 'Relatórios de Performance' },
  '/configuracoes': { title: 'Configurações' },
  '/minhaconta': { title: 'Minha Conta' },
  '/admin/usuarios': { title: 'Usuários' },
  '/cobrancas': { title: 'Faturamento e Cobranças' },
}

/**
 * Find config for a pathname. Tries exact match first, then strips dynamic segments.
 */
export function getRouteConfig(pathname: string): RouteConfig | undefined {
  // Exact match
  if (routeConfigs[pathname]) return routeConfigs[pathname]

  // Strip trailing dynamic segments (e.g. /fornecedores/abc → /fornecedores/[id])
  // Try progressively shorter paths
  const segments = pathname.split('/').filter(Boolean)
  for (let i = segments.length - 1; i >= 0; i--) {
    const partial = '/' + segments.slice(0, i).join('/')
    if (routeConfigs[partial]) return undefined // don't fallback to parent — let the page set its own header
  }

  return undefined
}
