import { SupabaseClient } from '@supabase/supabase-js'

type ResolvedClient = {
  id: string
  name: string
}

type ResolvedSupplier = {
  id: string
  name: string
  commission_rule_id: string | null
}

export type NameResolutionResult = {
  client: ResolvedClient | null
  supplier: ResolvedSupplier | null
  errors: string[]
}

export async function resolveNames(
  supabase: SupabaseClient,
  userId: string,
  clientName: string,
  supplierName: string
): Promise<NameResolutionResult> {
  const errors: string[] = []
  let client: ResolvedClient | null = null
  let supplier: ResolvedSupplier | null = null

  // Resolver cliente
  const { data: clients, error: clientError } = await supabase
    .from('personal_clients')
    .select('id, name')
    .eq('user_id', userId)
    .eq('is_active', true)
    .ilike('name', `%${clientName}%`)
    .limit(10)

  if (clientError) {
    errors.push('Erro ao buscar clientes.')
  } else if (!clients || clients.length === 0) {
    errors.push(`Nenhum cliente encontrado com o nome "${clientName}".`)
  } else {
    // Match exato (case-insensitive) tem prioridade
    const exactMatch = clients.find(
      (c) => c.name.toLowerCase() === clientName.toLowerCase()
    )
    if (exactMatch) {
      client = { id: exactMatch.id, name: exactMatch.name }
    } else if (clients.length === 1) {
      client = { id: clients[0].id, name: clients[0].name }
    } else {
      const names = clients.map((c) => `"${c.name}"`).join(', ')
      errors.push(
        `Encontrei ${clients.length} clientes com nome parecido: ${names}. Qual deles?`
      )
    }
  }

  // Resolver pasta/fornecedor
  const { data: suppliers, error: supplierError } = await supabase
    .from('personal_suppliers')
    .select('id, name, commission_rule_id')
    .eq('user_id', userId)
    .ilike('name', `%${supplierName}%`)
    .limit(10)

  if (supplierError) {
    errors.push('Erro ao buscar pastas.')
  } else if (!suppliers || suppliers.length === 0) {
    errors.push(`Nenhuma pasta encontrada com o nome "${supplierName}".`)
  } else {
    const exactMatch = suppliers.find(
      (s) => s.name.toLowerCase() === supplierName.toLowerCase()
    )
    if (exactMatch) {
      supplier = {
        id: exactMatch.id,
        name: exactMatch.name,
        commission_rule_id: exactMatch.commission_rule_id,
      }
    } else if (suppliers.length === 1) {
      supplier = {
        id: suppliers[0].id,
        name: suppliers[0].name,
        commission_rule_id: suppliers[0].commission_rule_id,
      }
    } else {
      const names = suppliers.map((s) => `"${s.name}"`).join(', ')
      errors.push(
        `Encontrei ${suppliers.length} pastas com nome parecido: ${names}. Qual delas?`
      )
    }
  }

  return { client, supplier, errors }
}
