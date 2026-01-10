/**
 * Format currency with abbreviations
 */
export function formatCurrencyAbbreviated(value: number, locale: string = 'pt-BR'): {
  short: string
  full: string
  abbreviated: boolean
} {
  const fullValue = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

  // Under 1k - no abbreviation
  if (Math.abs(value) < 1000) {
    return { short: fullValue, full: fullValue, abbreviated: false }
  }

  // 1k - 999k
  if (Math.abs(value) < 1000000) {
    const k = value / 1000
    // Keep one decimal if valuable (2.741 → 2,7k, but 2.000 → 2k)
    const formatted = k % 1 === 0 
      ? `R$ ${k.toFixed(0)}k` 
      : `R$ ${k.toFixed(1).replace('.', ',')}k`
    return { short: formatted, full: fullValue, abbreviated: true }
  }

  // 1M+
  const m = value / 1000000
  const formatted = m % 1 === 0
    ? `R$ ${m.toFixed(0)}M`
    : `R$ ${m.toFixed(1).replace('.', ',')}M`
  return { short: formatted, full: fullValue, abbreviated: true }
}

/**
 * Remove cents from currency string
 * R$ 2.741,68 → R$ 2.741
 */
export function formatCurrencyNoCents(value: string): string {
  return value.replace(/,\d{2}$/, '')
}

/**
 * Get character width estimation for font size calculation
 */
export function estimateTextWidth(text: string, fontSize: number): number {
  // Rough estimation: 0.6 * fontSize per character for bold text
  return text.length * (fontSize * 0.6)
}
