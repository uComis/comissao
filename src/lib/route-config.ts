type RouteConfig = {
  title: string
  description?: string
  backHref?: string
}

export const routeConfigs: Record<string, RouteConfig> = {
  '/': { title: 'Dashboard' },
  '/dashboard': { title: 'Dashboard' },
  '/home': { title: 'Dashboard' },
  '/recebiveis': { title: 'Faturamento', description: 'Resumo de fluxo de caixa e comissões.' },
  '/clientes': { title: 'Meus Clientes', description: 'Gerencie sua carteira de clientes' },
  '/minhasvendas': { title: 'Minhas Vendas', description: 'Clique na linha para visualizar ou clique com o botão direito para mais opções' },
  '/minhasvendas/nova': { title: 'Registro de venda', backHref: '/minhasvendas' },
  '/fornecedores': { title: 'Minhas Pastas', description: 'Empresas que você representa' },
  '/fornecedores/novo': { title: 'Nova Pasta', description: 'Cadastre uma nova empresa/fábrica que você representa', backHref: '/fornecedores' },
  '/vendedores': { title: 'Vendedores', description: 'Gerencie os vendedores da sua organização' },
  '/vendas': { title: 'Vendas', description: 'Vendas importadas do CRM' },
  '/regras': { title: 'Regras de Comissão', description: 'Configure as regras de cálculo de comissões' },
  '/relatorios': { title: 'Relatórios', description: 'Visão consolidada para fechamento' },
  '/relatorios-vendedor': { title: 'Relatórios de Performance', description: 'Análise estratégica da sua carteira, fornecedores e resultados.' },
  '/configuracoes': { title: 'Configurações', description: 'Gerencie integrações e configurações da organização' },
  '/minhaconta': { title: 'Minha Conta', description: 'Gerencie suas informações' },
  '/admin/usuarios': { title: 'Usuários', description: 'Gerencie os usuários do sistema' },
  '/cobrancas': { title: 'Faturamento e Cobranças', description: 'Gerencie seus pagamentos, histórico de faturas e status da sua assinatura.' },
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
