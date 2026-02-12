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
- Se o usuário não informar a data, omita o parâmetro (será usada a data de hoje).`,
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
        sale_date: {
          type: 'string',
          description:
            'Data da venda no formato YYYY-MM-DD. Omitir para usar hoje.',
        },
        notes: {
          type: 'string',
          description: 'Observações adicionais sobre a venda',
        },
      },
      required: ['client_name', 'supplier_name', 'gross_value'],
    },
  },
]
