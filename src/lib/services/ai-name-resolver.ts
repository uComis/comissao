import { SupabaseClient } from '@supabase/supabase-js'

// =====================================================
// TYPES
// =====================================================

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

export type SingleNameResult = {
  match: { id: string; name: string; commission_rule_id?: string | null } | null
  candidates: { id: string; name: string; score: number }[] | null
  error: string | null
}

type TableMatch = {
  id: string
  name: string
  commission_rule_id?: string | null
  score: number
  table: 'clients' | 'suppliers'
}

// =====================================================
// ACCENT HANDLING (exported for reuse)
// =====================================================

export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Convert a word to a POSIX regex that matches with or without accents */
export function toAccentRegex(word: string): string {
  const map: Record<string, string> = {
    a: '[aáâãàä]', e: '[eéêèë]', i: '[iíîìï]',
    o: '[oóôõòö]', u: '[uúûùü]', c: '[cç]', n: '[nñ]',
  }
  return removeAccents(word.toLowerCase())
    .split('')
    .map((ch) => map[ch] || escapeRegex(ch))
    .join('')
}

// =====================================================
// SCORING (exported for reuse)
// =====================================================

export function scoreMatch(search: string, candidate: string): number {
  const s = removeAccents(search).toLowerCase().trim()
  const c = removeAccents(candidate).toLowerCase().trim()

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

// =====================================================
// WORD-BASED SEARCH
// =====================================================

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

  // Chain accent-insensitive regex for each word
  for (const word of words) {
    query = query.filter('name', 'imatch', toAccentRegex(word))
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

// =====================================================
// PICK BEST MATCH
// =====================================================

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

// =====================================================
// ATOMIC SINGLE-NAME RESOLVER
// =====================================================

/**
 * Resolve a single name term against one table.
 * Returns match, candidates (if ambiguous), or error.
 */
export async function resolveName(
  supabase: SupabaseClient,
  userId: string,
  term: string,
  table: 'clients' | 'suppliers'
): Promise<SingleNameResult> {
  const dbTable = table === 'clients' ? 'personal_clients' : 'personal_suppliers'
  const matches = await searchInTable(supabase, userId, term, dbTable)

  const result = pickBest(matches)

  if (!result) {
    const label = table === 'clients' ? 'cliente' : 'pasta'
    return {
      match: null,
      candidates: null,
      error: `${label === 'cliente' ? 'O' : 'A'} ${label} "${term}" não foi encontrad${label === 'cliente' ? 'o' : 'a'}.`,
    }
  }

  if ('candidates' in result) {
    const label = table === 'clients' ? 'clientes' : 'pastas'
    const names = result.candidates.map((c) => `"${c.name}"`).join(', ')
    return {
      match: null,
      candidates: result.candidates.map((c) => ({
        id: c.id,
        name: c.name,
        score: c.score,
      })),
      error: `Encontrei ${result.candidates.length} ${label} com nome parecido com "${term}": ${names}. Qual del${table === 'clients' ? 'es' : 'as'}?`,
    }
  }

  return {
    match: {
      id: result.match.id,
      name: result.match.name,
      commission_rule_id: result.match.commission_rule_id,
    },
    candidates: null,
    error: null,
  }
}

// =====================================================
// DUAL-NAME RESOLVER (used by create_sale)
// =====================================================

/**
 * Resolve client + supplier names with swap detection.
 * 100% backward-compatible with existing create_sale flow.
 */
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
      `O cliente "${clientSearch}" não foi encontrado.`
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
      `A pasta "${supplierSearch}" não foi encontrada.`
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
