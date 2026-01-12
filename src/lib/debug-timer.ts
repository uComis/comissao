const isDev = process.env.NODE_ENV === 'development'

export function startTimer(label: string) {
  if (!isDev) return { end: () => {} }
  
  const start = Date.now()
  console.log(`🔵 [START] ${label}`)
  
  return {
    end: (msg?: string) => {
      const duration = Date.now() - start
      console.log(`🔵 [END] ${label}${msg ? ` - ${msg}` : ''} - ${duration}ms`)
    }
  }
}

export function logDebug(label: string, msg?: string) {
  if (!isDev) return
  console.log(`  ⏱️  [${label}] ${msg || ''}`)
}
