import type { AiFunctionDeclaration } from './types'

export const KAI_TOOLS: AiFunctionDeclaration[] = [
  {
    name: 'create_sale',
    description: `Registra uma nova venda para o usuário. Use esta função quando o usuário pedir para registrar, cadastrar ou criar uma venda.

IMPORTANTE:
- Sempre peça os dados obrigatórios antes de chamar: nome do cliente, nome da pasta/fornecedor e valor bruto.
- Nunca invente nomes de clientes ou pastas — use exatamente o que o usuário informou.
- Se o usuário não informar a data, omita o parâmetro (será usada a data de hoje).
- Se o usuário não informar notas/observações, omita o parâmetro.`,
    parameters: {
      type: 'object',
      properties: {
        client_name: {
          type: 'string',
          description: 'Nome do cliente exatamente como o usuário informou',
        },
        supplier_name: {
          type: 'string',
          description: 'Nome da pasta/fornecedor/representada exatamente como o usuário informou',
        },
        gross_value: {
          type: 'number',
          description: 'Valor bruto da venda em reais (ex: 5000 para R$ 5.000)',
        },
        sale_date: {
          type: 'string',
          description: 'Data da venda no formato YYYY-MM-DD. Omitir para usar hoje.',
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
