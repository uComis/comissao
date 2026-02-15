import type { AiFunctionDeclaration } from './types'

// Query tools — Kai calls these to fetch data on demand.
// The result goes back to the model as tool_response so it can reason over it.
export const KAI_QUERY_TOOLS: AiFunctionDeclaration[] = [
  {
    name: 'get_dashboard',
    description: `Busca as métricas do dashboard do mês atual: comissão, vendas, financeiro, rankings de clientes e pastas. Use quando o usuário perguntar sobre seus números do mês, como está o progresso da meta, quantas vendas fez, qual cliente ou pasta mais vendeu, ranking, etc.

Exemplos: "como estão minhas vendas?", "quanto ganhei esse mês?", "como está minha meta?", "qual minha pasta mais rentável?", "qual cliente mais comprou?"`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_supplier_list',
    description: `Lista todas as pastas/fornecedores do usuário com suas regras de comissão. Use quando o usuário perguntar sobre suas pastas, quais fornecedores tem, qual a comissão de uma pasta, etc.

Exemplos: "quais são minhas pastas?", "qual a comissão da Coca?", "me mostra meus fornecedores"`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_client_list',
    description: `Lista todos os clientes ativos do usuário. Use quando o usuário perguntar sobre seus clientes cadastrados.

Exemplos: "quais são meus clientes?", "quantos clientes tenho?", "me mostra a lista de clientes"`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_receivables_summary',
    description: `Busca o resumo de recebíveis do usuário: totais pendentes, vencidos e recebidos. Use quando o usuário perguntar sobre o total que tem a receber, quanto está atrasado, etc.

Exemplos: "quanto tenho a receber?", "tem alguma parcela atrasada?", "quanto já recebi?"`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_recent_sales',
    description: `Busca as vendas mais recentes do usuário, opcionalmente filtradas por cliente ou pasta. Use para responder sobre última(s) venda(s), vendas recentes, ou detalhes de vendas específicas.

Exemplos: "qual foi minha última venda?", "últimas vendas da Coca", "o que vendi pro João recentemente?"`,
    parameters: {
      type: 'object',
      properties: {
        client_name: {
          type: 'string',
          description: 'Filtrar por nome do cliente (pode ser parcial)',
        },
        supplier_name: {
          type: 'string',
          description: 'Filtrar por nome da pasta/fornecedor (pode ser parcial)',
        },
        limit: {
          type: 'number',
          description: 'Número de vendas a retornar (padrão: 5, máximo: 20)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_historical_data',
    description: `Busca vendas e comissões de um período específico. Use quando o usuário perguntar sobre dados de meses anteriores, comparações, totais de um período, etc.

Você pode usar QUALQUER formato:
- **period** (linguagem natural): "último trimestre", "entre outubro e dezembro", "mês passado", "últimos 3 meses", "janeiro", "ano passado"
- **date_from + date_to** (YYYY-MM-DD): "2025-10-01" e "2025-12-31"

PREFIRA usar "period" com o texto exato do usuário — o backend resolve as datas. Só use date_from/date_to se o usuário informou datas específicas.
NUNCA pergunte "para qual ano?" — o backend infere o ano automaticamente.`,
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          description: 'Período em linguagem natural (ex: "último trimestre", "entre outubro e dezembro", "janeiro", "mês passado", "últimos 3 meses", "ano passado", "semana passada")',
        },
        date_from: {
          type: 'string',
          description: 'Data início do período (YYYY-MM-DD) — use só se o usuário deu data específica',
        },
        date_to: {
          type: 'string',
          description: 'Data fim do período (YYYY-MM-DD) — use só se o usuário deu data específica',
        },
      },
      required: [],
    },
  },
]

// Action tools — these perform side effects (create, update).
// Handled after stream completes.
export const KAI_ACTION_TOOLS: AiFunctionDeclaration[] = [
  {
    name: 'create_sale',
    description: `Registra uma nova venda para o usuário. Chame esta função IMEDIATAMENTE quando o usuário mencionar uma venda com pelo menos dois nomes (cliente e pasta/fornecedor) e um valor.

REGRAS:
- Chame IMEDIATAMENTE com os dados que o usuário deu — NÃO peça confirmação, o card de preview É a confirmação.
- NÃO peça "nome completo" — o backend resolve nomes parciais (ex: "coca" resolve para "Coca-Cola FEMSA").
- Use exatamente o texto que o usuário informou nos campos de nome — o backend faz o match.
- Se o usuário só deu dois nomes e um valor mas não ficou claro qual é cliente e qual é pasta, coloque o primeiro nome como supplier e o segundo como client (o backend corrige se necessário).
- Só pergunte se faltar o valor bruto da venda. Nome e pasta parciais são suficientes.
- Se o usuário informar comissão e/ou taxa, passe nos campos commission_rate e tax_rate (apenas o número, ex: 8 para 8%).
- Se o usuário NÃO informar comissão/taxa, omita — o backend usa os valores padrão da pasta.
- Se o usuário não informar a data, omita o parâmetro (será usada a data de hoje).
- Se o usuário mencionar prazo/parcelas de pagamento, converta para o formato "dias/dias/dias" e passe em payment_condition:
  "3 parcelas de 30 dias" → "30/60/90"
  "45 dias, 3 vezes, intervalo de 40 dias" → "45/85/125"
  "pagamento em 60 dias" → "60"
  "à vista" → "0"
- Se o usuário não mencionar condição de pagamento, omita payment_condition.`,
    parameters: {
      type: 'object',
      properties: {
        client_name: {
          type: 'string',
          description:
            'Nome do cliente como o usuário informou (pode ser parcial)',
        },
        supplier_name: {
          type: 'string',
          description:
            'Nome da pasta/fornecedor/representada como o usuário informou (pode ser parcial)',
        },
        gross_value: {
          type: 'number',
          description: 'Valor bruto da venda em reais (ex: 5000 para R$ 5.000)',
        },
        commission_rate: {
          type: 'number',
          description:
            'Percentual de comissão informado pelo usuário (ex: 8 para 8%). Omitir se o usuário não informou — o backend usa o padrão da pasta.',
        },
        tax_rate: {
          type: 'number',
          description:
            'Percentual de taxa/dedução informado pelo usuário (ex: 3.5 para 3,5%). Omitir se o usuário não informou — o backend usa o padrão da pasta.',
        },
        sale_date: {
          type: 'string',
          description:
            'Data da venda no formato YYYY-MM-DD. Omitir para usar hoje.',
        },
        payment_condition: {
          type: 'string',
          description:
            'Condição de pagamento no formato "dias/dias/dias". Exemplos: "30/60/90" para 3x de 30 dias, "45/85/125" para primeira em 45 dias com intervalo de 40, "60" para pagamento único em 60 dias, "0" para à vista. Omitir se o usuário não informou.',
        },
        notes: {
          type: 'string',
          description: 'Observações adicionais sobre a venda',
        },
      },
      required: ['client_name', 'supplier_name', 'gross_value'],
    },
  },
  {
    name: 'create_client',
    description: `Cadastra um novo cliente. Use quando o usuário pedir para cadastrar um cliente OU quando tentar registrar uma venda mas o cliente não existir.

QUANDO USAR:
- Usuário pede diretamente: "Cadastra o cliente João Silva"
- Durante venda, cliente não encontrado: pergunte "O cliente 'X' não foi encontrado, deseja criar ele?"

DADOS OBRIGATÓRIOS:
- name (nome do cliente)

DADOS OPCIONAIS (pergunte se o usuário quiser informar):
- phone (telefone)
- email (e-mail)
- notes (observações)

NÃO pergunte tudo de uma vez. Pergunte apenas: "Preciso só do nome mesmo ou tem telefone/email?"

DUPLICATAS: o backend verifica automaticamente se já existe um cliente com nome parecido. Se existir, ele pergunta ao usuário se quer criar mesmo assim. Se o usuário confirmar, chame a função novamente com o mesmo nome.`,
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nome do cliente',
        },
        phone: {
          type: 'string',
          description: 'Telefone do cliente (opcional)',
        },
        email: {
          type: 'string',
          description: 'E-mail do cliente (opcional)',
        },
        notes: {
          type: 'string',
          description: 'Observações sobre o cliente (opcional)',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'create_supplier',
    description: `Cadastra uma nova pasta/fornecedor. Use quando o usuário pedir para cadastrar uma pasta OU quando tentar registrar uma venda mas a pasta não existir.

QUANDO USAR:
- Usuário pede diretamente: "Cadastra a pasta Ambev"
- Durante venda, pasta não encontrada: pergunte "A pasta 'X' não existe, deseja criar ela?"

DADOS OBRIGATÓRIOS:
- name (nome da pasta/fornecedor)
- commission_rate (percentual de comissão padrão, ex: 10 para 10%)

DADOS OPCIONAIS:
- tax_rate (percentual de taxa/dedução padrão, ex: 3.5 para 3,5%)
- cnpj (CNPJ do fornecedor)

FLUXO:
1. Se o usuário não informou a comissão, pergunte: "Qual a comissão padrão dessa pasta? (ex: 10%)"
2. NÃO pergunte sobre taxa se não for mencionado — pode ser 0.

DUPLICATAS: o backend verifica automaticamente se já existe uma pasta com nome parecido. Se existir, ele pergunta ao usuário se quer criar mesmo assim. Se o usuário confirmar, chame a função novamente com o mesmo nome.`,
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nome da pasta/fornecedor',
        },
        commission_rate: {
          type: 'number',
          description:
            'Percentual de comissão padrão (ex: 10 para 10%). OBRIGATÓRIO.',
        },
        tax_rate: {
          type: 'number',
          description:
            'Percentual de taxa/dedução padrão (ex: 3.5 para 3,5%). Opcional, default 0.',
        },
        cnpj: {
          type: 'string',
          description: 'CNPJ do fornecedor (opcional)',
        },
      },
      required: ['name', 'commission_rate'],
    },
  },
  {
    name: 'search_receivables',
    description: `Busca parcelas de comissão (recebíveis) do usuário para registrar recebimento. Use quando o usuário quiser marcar parcelas como recebidas ou perguntar sobre parcelas específicas.

QUANDO USAR:
- "Recebi da Coca Cola" → buscar parcelas pendentes da Coca Cola
- "A parcela do João que vencia dia 15 foi paga" → buscar parcela do João com vencimento dia 15
- "Quero fechar as parcelas desse mês" → buscar parcelas pendentes do mês atual
- "O cliente X pagou hoje" → buscar parcelas pendentes do cliente X

REGRAS:
- Chame IMEDIATAMENTE quando o usuário mencionar recebimento — NÃO peça confirmação, o card de preview É a confirmação.
- Use exatamente o texto que o usuário informou nos campos de nome — o backend resolve nomes parciais automaticamente (ex: "coca" → "Coca-Cola FEMSA"). Se o nome for ambíguo, o backend retorna candidatos para o usuário escolher.
- Converta períodos para datas no formato YYYY-MM-DD:
  "este mês" → primeiro e último dia do mês atual
  "semana que vem" → próxima segunda a domingo
  "janeiro" → 01/01 a 31/01 do ano atual
- Se o usuário não especificar status, omita (default: pendentes + atrasadas).
- Se o usuário mencionar "atrasadas" ou "vencidas", use status "overdue".
- Se o usuário falar "todas", use status "all".
- Não precisa de todos os parâmetros — qualquer combinação é válida.
- Se o backend detectar que o nome informado como cliente é na verdade uma pasta (ou vice-versa), ele sugere a correção automaticamente.`,
    parameters: {
      type: 'object',
      properties: {
        client_name: {
          type: 'string',
          description:
            'Nome do cliente (pode ser parcial, ex: "coca" para "Coca-Cola FEMSA")',
        },
        supplier_name: {
          type: 'string',
          description: 'Nome da pasta/fornecedor (pode ser parcial)',
        },
        status: {
          type: 'string',
          enum: ['pending', 'overdue', 'pending_and_overdue', 'all'],
          description:
            'Filtro de status. Default: pending_and_overdue (pendentes + atrasadas)',
        },
        due_date_from: {
          type: 'string',
          description:
            'Data início do período de vencimento (YYYY-MM-DD)',
        },
        due_date_to: {
          type: 'string',
          description:
            'Data fim do período de vencimento (YYYY-MM-DD)',
        },
        installment_number: {
          type: 'number',
          description:
            'Número da parcela específica (ex: 2 para "segunda parcela")',
        },
        sale_number: {
          type: 'number',
          description: 'Número da venda (ex: 42 para "venda #42")',
        },
      },
      required: [],
    },
  },
]

// Navigation tool — handled inline during stream
export const KAI_NAV_TOOLS: AiFunctionDeclaration[] = [
  {
    name: 'navigate_to',
    description: `Navega o usuário para uma página do app. Use quando o usuário pedir para ir a uma tela, ou quando quiser direcioná-lo a uma funcionalidade.

Exemplos: "me leva pro faturamento", "abre minhas vendas", "quero ver meus clientes", "vai pra configurações"

IMPORTANTE: Use apenas os valores permitidos no campo "page". Não invente páginas.`,
    parameters: {
      type: 'object',
      properties: {
        page: {
          type: 'string',
          enum: [
            'home',
            'vendas',
            'nova_venda',
            'faturamento',
            'clientes',
            'pastas',
            'planos',
            'conta',
            'configuracoes',
            'ajuda',
          ],
          description:
            'Página de destino: home, vendas, nova_venda, faturamento, clientes, pastas, planos, conta, configuracoes, ajuda',
        },
      },
      required: ['page'],
    },
  },
]

// Combined for the AI model — includes both query and action tools
export const KAI_TOOLS: AiFunctionDeclaration[] = [
  ...KAI_QUERY_TOOLS,
  ...KAI_ACTION_TOOLS,
  ...KAI_NAV_TOOLS,
]

// Set of query tool names for quick lookup
export const QUERY_TOOL_NAMES = new Set(
  KAI_QUERY_TOOLS.map((t) => t.name)
)
