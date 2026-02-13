'use client'

import { useCallback, useSyncExternalStore } from 'react'

const KEYS = {
  hasUsed: 'kai_has_used',
  dashboardSeen: 'kai_dashboard_card_seen',
} as const

// Notify all subscribers when any kai onboarding key changes
const listeners = new Set<() => void>()
function emitChange() {
  listeners.forEach((l) => l())
}
function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function get(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function set(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // localStorage unavailable
  }
  emitChange()
}

export function useKaiOnboarding() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return [
          localStorage.getItem(KEYS.hasUsed),
          localStorage.getItem(KEYS.dashboardSeen),
        ].join('|')
      } catch {
        return '||'
      }
    },
    () => '||' // SSR
  )

  const [rawUsed, rawSeen] = snapshot.split('|')
  const hasUsedKai = rawUsed === '1'
  const hasSeen = rawSeen === '1'

  // First visit: prominent card at top
  const shouldShowDashboardCard = !hasUsedKai && !hasSeen

  // Second visit+: subtle banner between stats and charts
  const shouldShowDashboardBanner = !hasUsedKai && hasSeen

  const markDashboardCardSeen = useCallback(() => {
    set(KEYS.dashboardSeen, '1')
  }, [])

  return {
    hasUsedKai,
    shouldShowDashboardCard,
    shouldShowDashboardBanner,
    markDashboardCardSeen,
  }
}
