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
]
