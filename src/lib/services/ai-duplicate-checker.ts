import { SupabaseClient } from '@supabase/supabase-js'
import { resolveName, scoreMatch } from './ai-name-resolver'

export type DuplicateCheckResult = {
  hasDuplicate: boolean
  match: { id: string; name: string; score: number } | null
}

/**
 * Check if a name already exists in a table before creating a new entity.
 *
 * - score 100 (exact name) → hasDuplicate: true, but caller can allow insert
 *   (user explicitly typed the exact same name, so they know it exists)
 * - score 70-99 (similar) → hasDuplicate: true, caller should ask user
 * - score < 70 or no match → hasDuplicate: false
 */
export async function checkDuplicate(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  table: 'clients' | 'suppliers'
): Promise<DuplicateCheckResult> {
  const result = await resolveName(supabase, userId, name, table)

  if (!result.match) {
    // Check candidates too — they might have score >= 70
    if (result.candidates && result.candidates.length > 0) {
      const best = result.candidates[0]
      if (best.score >= 70) {
        return { hasDuplicate: true, match: best }
      }
    }
    return { hasDuplicate: false, match: null }
  }

  // resolveName resolved to a single match — compute actual score against input
  const actualScore = scoreMatch(name, result.match.name)

  if (actualScore >= 70) {
    return {
      hasDuplicate: true,
      match: { id: result.match.id, name: result.match.name, score: actualScore },
    }
  }

  return { hasDuplicate: false, match: null }
}
