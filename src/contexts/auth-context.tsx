'use client'

import { createContext, useContext } from 'react'

type AuthUser = {
  id: string
  email?: string
  user_metadata?: Record<string, string>
  app_metadata?: Record<string, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  identities?: any[]
  aud?: string
  created_at?: string
}

type AuthContextType = {
  user: AuthUser | null
  loading: boolean
  isConfigured: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
  signUpWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  linkIdentity: (provider: 'google', redirectTo?: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

const noop = async () => {}
const noopWithError = async () => ({ error: null })

const defaultAuth: AuthContextType = {
  user: null,
  loading: false,
  isConfigured: false,
  signInWithGoogle: noop,
  signInWithEmail: noopWithError,
  signUpWithPassword: noopWithError,
  signInWithPassword: noopWithError,
  resetPassword: noopWithError,
  linkIdentity: noop,
  signOut: noop,
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    return defaultAuth
  }
  return context
}
