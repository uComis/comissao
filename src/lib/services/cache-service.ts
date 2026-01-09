import { createClient } from '../supabase-server'

export interface CacheEntry<T = any> {
  data: T
  updated_at: string
  expires_at: string | null
}

export class CacheService {
  /**
   * Obtém um dado do cache. Ignora se estiver expirado.
   */
  static async get<T = any>(key: string): Promise<T | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
      .from('app_cache')
      .select('data, expires_at')
      .eq('user_id', user.id)
      .eq('cache_key', key)
      .single()

    if (error || !data) return null

    // Verifica expiração (TTL)
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null
    }

    return data.data as T
  }

  /**
   * Salva um dado no cache (Upsert).
   * @param key Chave do cache
   * @param value O objeto a ser cacheado
   * @param ttlSeconds (Opcional) Tempo de vida em segundos. Null para eterno.
   */
  static async set(key: string, value: any, ttlSeconds: number | null = null): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const expires_at = ttlSeconds 
      ? new Date(Date.now() + ttlSeconds * 1000).toISOString()
      : null

    const { error } = await supabase
      .from('app_cache')
      .upsert({
        user_id: user.id,
        cache_key: key,
        data: value,
        expires_at,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, cache_key'
      })

    return !error
  }

  /**
   * Limpa uma chave específica do cache.
   */
  static async invalidate(key: string): Promise<void> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase
      .from('app_cache')
      .delete()
      .eq('user_id', user.id)
      .eq('cache_key', key)
  }
}
