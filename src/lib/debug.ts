/**
 * Helper para modo debug
 * Ativa APENAS se:
 * 1. Ambiente local (localhost)
 * 2. DEBUG_MODE=true no .env
 */
export function isDebugMode(): boolean {
  const isLocalhost = 
    typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  
  const debugEnabled = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
  
  return isLocalhost && debugEnabled
}
