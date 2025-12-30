'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'app-preferences'

export type Preferences = {
  salesPageSize: number
  // Adicionar futuras preferências aqui
}

const defaults: Preferences = {
  salesPageSize: 25,
}

function getStoredPreferences(): Preferences {
  if (typeof window === 'undefined') return defaults
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaults
    return { ...defaults, ...JSON.parse(stored) }
  } catch {
    return defaults
  }
}

function savePreferences(prefs: Preferences): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Silently fail (quota exceeded, etc)
  }
}

export function usePreferences() {
  const [preferences, setPreferencesState] = useState<Preferences>(() => getStoredPreferences())
  const [loaded, setLoaded] = useState(false)

  // Marca como carregado no mount
  useEffect(() => {
    const timeout = setTimeout(() => setLoaded(true), 0)
    return () => clearTimeout(timeout)
  }, [])

  // Atualiza uma preferência específica
  const setPreference = useCallback(<K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) => {
    setPreferencesState((prev) => {
      const updated = { ...prev, [key]: value }
      savePreferences(updated)
      return updated
    })
  }, [])

  // Reseta para defaults
  const resetPreferences = useCallback(() => {
    setPreferencesState(defaults)
    savePreferences(defaults)
  }, [])

  return {
    preferences,
    setPreference,
    resetPreferences,
    loaded,
  }
}

