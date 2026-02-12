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

type TableMatch = {
  id: string
  name: string
  commission_rule_id?: string | null
  score: number
  table: 'clients' | 'suppliers'
}

// --- Scoring ---

function scoreMatch(search: string, candidate: string): number {
  const s = search.toLowerCase().trim()
  const c = candidate.toLowerCase().trim()

  // Exact match
  if (s === c) return 100

  // Candidate starts with search
  if (c.startsWith(s)) return 80

  // All search words start a word in candidate
  const searchWords = s.split(/\s+/)
  const candidateWords = c.split(/\s+/)
  const allWordsStartMatch = searchWords.every((sw) =>
    candidateWords.some((cw) => cw.startsWith(sw))
  )
  if (allWordsStartMatch) return 70

  // Simple contains
  if (c.includes(s)) return 50

  // Partial: at least one word matches
  const anyWordMatch = searchWords.some((sw) =>
    candidateWords.some((cw) => cw.includes(sw))
  )
  if (anyWordMatch) return 30

  return 0
}

// --- Word-based search ---

async function searchInTable(
  supabase: SupabaseClient,
  userId: string,
  searchName: string,
  table: 'personal_clients' | 'personal_suppliers'
): Promise<TableMatch[]> {
  const words = searchName
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)

  if (words.length === 0) return []

  const isSupplier = table === 'personal_suppliers'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = supabase.from(table).select('*').eq('user_id', userId) as any

  if (!isSupplier) {
    query = query.eq('is_active', true)
  }

  // Chain ilike for each word
  for (const word of words) {
    query = query.ilike('name', `%${word}%`)
  }

  const { data, error } = await query.limit(10)

  if (error || !data) return []

  const tableType = isSupplier ? 'suppliers' : 'clients'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[])
    .map((row) => ({
      id: row.id as string,
      name: row.name as string,
      commission_rule_id: isSupplier
        ? (row.commission_rule_id as string | null)
        : undefined,
      score: scoreMatch(searchName, row.name),
      table: tableType as 'clients' | 'suppliers',
    }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
}

// --- Pick best match from results ---

function pickBest(
  matches: TableMatch[]
): { match: TableMatch } | { candidates: TableMatch[] } | null {
  if (matches.length === 0) return null

  // Exact match (score 100) always wins
  const exact = matches.find((m) => m.score === 100)
  if (exact) return { match: exact }

  // Single result
  if (matches.length === 1) return { match: matches[0] }

  // Multiple results: if top score is clearly better (gap >= 20), use it
  if (matches[0].score - matches[1].score >= 20) {
    return { match: matches[0] }
  }

  // Ambiguous — return candidates
  return { candidates: matches.slice(0, 5) }
}

// --- Main resolver ---

export async function resolveNames(
  supabase: SupabaseClient,
  userId: string,
  clientName: string,
  supplierName: string
): Promise<NameResolutionResult> {
  const errors: string[] = []
  let client: ResolvedClient | null = null
  let supplier: ResolvedSupplier | null = null

  // 4 parallel queries: each name in both tables
  const [
    clientInClients,
    clientInSuppliers,
    supplierInClients,
    supplierInSuppliers,
  ] = await Promise.all([
    searchInTable(supabase, userId, clientName, 'personal_clients'),
    searchInTable(supabase, userId, clientName, 'personal_suppliers'),
    searchInTable(supabase, userId, supplierName, 'personal_clients'),
    searchInTable(supabase, userId, supplierName, 'personal_suppliers'),
  ])

  // Detect if swap is needed:
  // clientName only found in suppliers AND supplierName only found in clients
  const clientOnlyInSuppliers =
    clientInClients.length === 0 && clientInSuppliers.length > 0
  const supplierOnlyInClients =
    supplierInClients.length > 0 && supplierInSuppliers.length === 0

  let finalClientMatches: TableMatch[]
  let finalSupplierMatches: TableMatch[]
  let clientSearch: string
  let supplierSearch: string

  if (clientOnlyInSuppliers && supplierOnlyInClients) {
    // SWAP: user mixed up the names
    finalClientMatches = supplierInClients
    finalSupplierMatches = clientInSuppliers
    clientSearch = supplierName
    supplierSearch = clientName
  } else {
    // Normal: use hint (client_name → clients, supplier_name → suppliers)
    finalClientMatches = clientInClients
    finalSupplierMatches = supplierInSuppliers

    // If primary table has no results, try cross-table as fallback
    if (finalClientMatches.length === 0 && clientInSuppliers.length === 0) {
      // Try supplier table as last resort for client name
      finalClientMatches = supplierInClients
    }
    if (finalSupplierMatches.length === 0 && supplierInClients.length === 0) {
      // Try client table as last resort for supplier name
      finalSupplierMatches = clientInSuppliers
    }

    clientSearch = clientName
    supplierSearch = supplierName
  }

  // Resolve client
  const clientResult = pickBest(finalClientMatches)
  if (!clientResult) {
    errors.push(
      `Nenhum cliente encontrado com o nome "${clientSearch}". Verifique se o nome está correto ou cadastre o cliente primeiro.`
    )
  } else if ('candidates' in clientResult) {
    const names = clientResult.candidates.map((c) => `"${c.name}"`).join(', ')
    errors.push(
      `Encontrei ${clientResult.candidates.length} clientes com nome parecido com "${clientSearch}": ${names}. Qual deles?`
    )
  } else {
    client = { id: clientResult.match.id, name: clientResult.match.name }
  }

  // Resolve supplier
  const supplierResult = pickBest(finalSupplierMatches)
  if (!supplierResult) {
    errors.push(
      `Nenhuma pasta encontrada com o nome "${supplierSearch}". Verifique se o nome está correto ou cadastre a pasta primeiro.`
    )
  } else if ('candidates' in supplierResult) {
    const names = supplierResult.candidates
      .map((s) => `"${s.name}"`)
      .join(', ')
    errors.push(
      `Encontrei ${supplierResult.candidates.length} pastas com nome parecido com "${supplierSearch}": ${names}. Qual delas?`
    )
  } else {
    supplier = {
      id: supplierResult.match.id,
      name: supplierResult.match.name,
      commission_rule_id: supplierResult.match.commission_rule_id ?? null,
    }
  }

  return { client, supplier, errors }
}
