import type { AiFunctionDeclaration } from './types'

export const KAI_TOOLS: AiFunctionDeclaration[] = [
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
- address (endereço)

NÃO pergunte tudo de uma vez. Pergunte apenas: "Preciso só do nome mesmo ou tem telefone/email?"`,
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
        address: {
          type: 'string',
          description: 'Endereço do cliente (opcional)',
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
2. NÃO pergunte sobre taxa se não for mencionado — pode ser 0.`,
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
- Use exatamente o texto que o usuário informou nos campos de nome — o backend faz o match fuzzy.
- Converta períodos para datas no formato YYYY-MM-DD:
  "este mês" → primeiro e último dia do mês atual
  "semana que vem" → próxima segunda a domingo
  "janeiro" → 01/01 a 31/01 do ano atual
- Se o usuário não especificar status, omita (default: pendentes + atrasadas).
- Se o usuário mencionar "atrasadas" ou "vencidas", use status "overdue".
- Se o usuário falar "todas", use status "all".
- Não precisa de todos os parâmetros — qualquer combinação é válida.`,
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
