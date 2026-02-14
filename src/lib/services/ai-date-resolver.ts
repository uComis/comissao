/**
 * Resolve natural-language date expressions to { from, to } ranges.
 * Pure code — no database dependency.
 */

type DateRange = { from: string; to: string }

const MONTH_NAMES: Record<string, number> = {
  janeiro: 0, fevereiro: 1, marco: 2,
  abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8,
  outubro: 9, novembro: 10, dezembro: 11,
}

function fmt(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function monthRange(year: number, month: number): DateRange {
  return {
    from: `${year}-${String(month + 1).padStart(2, '0')}-01`,
    to: `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayOfMonth(year, month)).padStart(2, '0')}`,
  }
}

/**
 * Resolve a natural-language date expression to a date range.
 *
 * @param text - The expression (e.g. "dezembro", "esse mês", "ontem")
 * @param referenceDate - ISO date string for "today" (default: actual today)
 * @returns { from, to } in YYYY-MM-DD format, or null if unrecognized
 */
export function resolveDateRange(
  text: string,
  referenceDate?: string
): DateRange | null {
  const ref = referenceDate ? new Date(referenceDate + 'T12:00:00') : new Date()
  const input = text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  // ISO date pass-through (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return { from: input, to: input }
  }

  // "hoje"
  if (input === 'hoje') {
    const d = fmt(ref)
    return { from: d, to: d }
  }

  // "ontem"
  if (input === 'ontem') {
    const yesterday = new Date(ref)
    yesterday.setDate(yesterday.getDate() - 1)
    const d = fmt(yesterday)
    return { from: d, to: d }
  }

  // "esse mês" / "este mês" / "mes atual"
  if (/^(esse?|este|mes atual)(\s+mes)?$/.test(input) || input === 'mes atual') {
    return monthRange(ref.getFullYear(), ref.getMonth())
  }

  // "mês passado" / "mes anterior"
  if (/^mes\s+(passado|anterior)$/.test(input)) {
    const prev = new Date(ref)
    prev.setMonth(prev.getMonth() - 1)
    return monthRange(prev.getFullYear(), prev.getMonth())
  }

  // "essa semana" / "esta semana" / "semana atual"
  if (/^(essa?|esta)\s+semana$/.test(input) || input === 'semana atual') {
    const day = ref.getDay()
    const monday = new Date(ref)
    monday.setDate(ref.getDate() - (day === 0 ? 6 : day - 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return { from: fmt(monday), to: fmt(sunday) }
  }

  // "semana passada" / "semana anterior"
  if (/^semana\s+(passada|anterior)$/.test(input)) {
    const day = ref.getDay()
    const thisMonday = new Date(ref)
    thisMonday.setDate(ref.getDate() - (day === 0 ? 6 : day - 1))
    const prevMonday = new Date(thisMonday)
    prevMonday.setDate(thisMonday.getDate() - 7)
    const prevSunday = new Date(prevMonday)
    prevSunday.setDate(prevMonday.getDate() + 6)
    return { from: fmt(prevMonday), to: fmt(prevSunday) }
  }

  // "<mês> de <ano>" — e.g. "janeiro de 2025", "marco 2025"
  const monthYearMatch = input.match(
    /^(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+(?:de\s+)?(\d{4})$/
  )
  if (monthYearMatch) {
    const month = MONTH_NAMES[monthYearMatch[1]]
    const year = parseInt(monthYearMatch[2])
    return monthRange(year, month)
  }

  // Standalone month name — e.g. "dezembro"
  // If the month is in the future relative to ref, use previous year
  const monthOnly = MONTH_NAMES[input]
  if (monthOnly !== undefined) {
    let year = ref.getFullYear()
    if (monthOnly > ref.getMonth()) {
      year -= 1
    }
    return monthRange(year, monthOnly)
  }

  // "esse ano" / "este ano" / "ano atual"
  if (/^(esse?|este)\s+ano$/.test(input) || input === 'ano atual') {
    return {
      from: `${ref.getFullYear()}-01-01`,
      to: fmt(ref),
    }
  }

  // "ano passado" / "ano anterior"
  if (/^ano\s+(passado|anterior)$/.test(input)) {
    const prevYear = ref.getFullYear() - 1
    return {
      from: `${prevYear}-01-01`,
      to: `${prevYear}-12-31`,
    }
  }

  // "último trimestre" / "trimestre passado"
  if (/^(ultimo\s+trimestre|trimestre\s+passado)$/.test(input)) {
    const end = new Date(ref)
    end.setMonth(end.getMonth() - 1)
    const endRange = monthRange(end.getFullYear(), end.getMonth())
    const start = new Date(ref)
    start.setMonth(start.getMonth() - 3)
    const startRange = monthRange(start.getFullYear(), start.getMonth())
    return { from: startRange.from, to: endRange.to }
  }

  // "últimos N meses"
  const lastNMonthsMatch = input.match(/^ultimos?\s+(\d+)\s+mes(es)?$/)
  if (lastNMonthsMatch) {
    const n = parseInt(lastNMonthsMatch[1])
    const end = new Date(ref)
    end.setMonth(end.getMonth() - 1)
    const endRange = monthRange(end.getFullYear(), end.getMonth())
    const start = new Date(ref)
    start.setMonth(start.getMonth() - n)
    const startRange = monthRange(start.getFullYear(), start.getMonth())
    return { from: startRange.from, to: endRange.to }
  }

  // "entre <mês> e <mês>" — e.g. "entre janeiro e março", "entre outubro e dezembro"
  const MONTH_PATTERN = '(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)'
  const betweenMatch = input.match(
    new RegExp(`^entre\\s+${MONTH_PATTERN}\\s+e\\s+${MONTH_PATTERN}(?:\\s+(?:de\\s+)?(\\d{4}))?$`)
  )
  if (betweenMatch) {
    const startMonth = MONTH_NAMES[betweenMatch[1]]
    const endMonth = MONTH_NAMES[betweenMatch[2]]
    let year = betweenMatch[3] ? parseInt(betweenMatch[3]) : ref.getFullYear()
    // If end month is in the future, use previous year
    if (endMonth > ref.getMonth() && !betweenMatch[3]) {
      year -= 1
    }
    // Handle cross-year ranges (e.g. "entre outubro e janeiro")
    const startYear = startMonth > endMonth ? year - 1 : year
    const startRange = monthRange(startYear, startMonth)
    const endRange = monthRange(year, endMonth)
    return { from: startRange.from, to: endRange.to }
  }

  return null
}
