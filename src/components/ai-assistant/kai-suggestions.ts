import type { LucideIcon } from 'lucide-react'
import {
  ShoppingCart,
  BarChart3,
  HelpCircle,
  TrendingUp,
  Target,
  Users,
  Trophy,
  ArrowLeftRight,
  Search,
  CalendarCheck,
  ClipboardList,
  DollarSign,
  Receipt,
  Clock,
  FolderPlus,
  BookOpen,
  FileQuestion,
  Settings,
  Pencil,
  UserPlus,
  PersonStanding,
  Layers,
  Scale,
} from 'lucide-react'

export type KaiSuggestion = {
  icon: LucideIcon
  label: string
  prompt: string
}

type RouteEntry = {
  match: string
  exact?: boolean
  suggestions: KaiSuggestion[]
}

const ROUTE_SUGGESTIONS: RouteEntry[] = [
  // Mais específicas primeiro
  {
    match: '/minhasvendas/nova',
    exact: true,
    suggestions: [
      { icon: ClipboardList, label: 'Registrar por aqui', prompt: 'Me ajuda a registrar uma venda por aqui' },
      { icon: HelpCircle, label: 'Como preencher?', prompt: 'Como preencher o formulário de nova venda?' },
      { icon: DollarSign, label: 'Calcular comissão', prompt: 'Calcular comissão de uma venda' },
    ],
  },
  {
    match: '/fornecedores/',
    suggestions: [
      { icon: BookOpen, label: 'Regras desta pasta', prompt: 'Quais as regras de comissão desta pasta?' },
      { icon: FileQuestion, label: 'Como editar regras?', prompt: 'Como editar as regras de comissão de uma pasta?' },
      { icon: Pencil, label: 'Editar dados', prompt: 'Como editar os dados desta pasta?' },
    ],
  },
  // Rotas gerais
  {
    match: '/home',
    suggestions: [
      { icon: TrendingUp, label: 'Como estou esse mês?', prompt: 'Como estou esse mês?' },
      { icon: ShoppingCart, label: 'Registrar uma venda', prompt: 'Quero registrar uma venda' },
      { icon: Target, label: 'Quanto falta pra meta?', prompt: 'Quanto falta pra eu bater a meta?' },
    ],
  },
  {
    match: '/dashboard',
    suggestions: [
      { icon: BarChart3, label: 'Resumo do time', prompt: 'Me dá um resumo do desempenho do time' },
      { icon: Trophy, label: 'Ranking de vendedores', prompt: 'Qual o ranking dos vendedores?' },
      { icon: ArrowLeftRight, label: 'Comparar com mês anterior', prompt: 'Compara os resultados deste mês com o mês anterior' },
    ],
  },
  {
    match: '/minhasvendas',
    suggestions: [
      { icon: ShoppingCart, label: 'Registrar uma venda', prompt: 'Quero registrar uma venda' },
      { icon: Search, label: 'Buscar uma venda', prompt: 'Buscar uma venda específica' },
      { icon: CalendarCheck, label: 'Resumo de vendas do mês', prompt: 'Me dá um resumo das minhas vendas do mês' },
    ],
  },
  {
    match: '/faturamento',
    suggestions: [
      { icon: DollarSign, label: 'Quanto vou receber?', prompt: 'Quanto vou receber de comissão?' },
      { icon: Receipt, label: 'Registrar recebimento', prompt: 'Quero registrar um recebimento' },
      { icon: Clock, label: 'Comissões atrasadas', prompt: 'Tenho comissões atrasadas?' },
    ],
  },
  {
    match: '/fornecedores',
    suggestions: [
      { icon: FolderPlus, label: 'Adicionar uma pasta', prompt: 'Como adicionar uma nova pasta?' },
      { icon: BookOpen, label: 'Ver regras', prompt: 'Me mostra as regras de comissão das minhas pastas' },
      { icon: HelpCircle, label: 'O que são pastas?', prompt: 'O que são pastas no uComis?' },
    ],
  },
  {
    match: '/clientes',
    suggestions: [
      { icon: UserPlus, label: 'Adicionar cliente', prompt: 'Como adicionar um novo cliente?' },
      { icon: Search, label: 'Buscar cliente', prompt: 'Buscar um cliente específico' },
      { icon: ShoppingCart, label: 'Vendas por cliente', prompt: 'Me mostra as vendas por cliente' },
    ],
  },
  {
    match: '/regras',
    suggestions: [
      { icon: Scale, label: 'Explicar regras', prompt: 'Me explica como funcionam as regras de comissão' },
      { icon: Settings, label: 'Criar uma regra', prompt: 'Como criar uma regra de comissão?' },
      { icon: Layers, label: 'Regra escalonada', prompt: 'Como funciona uma regra escalonada?' },
    ],
  },
  {
    match: '/vendedores',
    suggestions: [
      { icon: TrendingUp, label: 'Desempenho de vendedor', prompt: 'Como está o desempenho dos vendedores?' },
      { icon: PersonStanding, label: 'Adicionar vendedor', prompt: 'Como adicionar um vendedor?' },
      { icon: Trophy, label: 'Ranking do time', prompt: 'Qual o ranking do time de vendedores?' },
    ],
  },
]

const FALLBACK_SUGGESTIONS: KaiSuggestion[] = [
  { icon: ShoppingCart, label: 'Registrar uma venda', prompt: 'Quero registrar uma venda' },
  { icon: BarChart3, label: 'Ver meus resultados', prompt: 'Ver meus resultados' },
  { icon: HelpCircle, label: 'Como funciona o uComis?', prompt: 'Como funciona o uComis?' },
]

export function getSuggestionsForRoute(pathname: string): KaiSuggestion[] {
  for (const entry of ROUTE_SUGGESTIONS) {
    if (entry.exact) {
      if (pathname === entry.match) return entry.suggestions
    } else {
      if (pathname.startsWith(entry.match)) return entry.suggestions
    }
  }
  return FALLBACK_SUGGESTIONS
}
