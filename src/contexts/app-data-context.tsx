'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from './auth-context'
import { updateProfile } from '@/app/actions/profiles'

type Organization = {
  id: string
  name: string
  email: string | null
  owner_id: string
  tax_deduction_rate: number | null
  created_at: string
  updated_at: string
}

type UserEmail = {
  id: string
  email: string
  is_primary: boolean
  verified: boolean
}

type UserProfile = {
  id: string
  email: string
  name: string | null
  document: string | null
  document_type: 'CPF' | 'CNPJ' | null
  avatar_url: string | null
  is_super_admin: boolean
  emails: UserEmail[]
}

type UserMode = 'personal' | 'organization' | null

type AppDataContextType = {
  profile: UserProfile | null
  organization: Organization | null
  userMode: UserMode
  loading: boolean
  refresh: () => Promise<void>
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined)

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [userMode, setUserMode] = useState<UserMode>(null)
  const [loading, setLoading] = useState(true)
  const { user, isConfigured } = useAuth()
  const supabase = createClient()
  const isFetching = useRef(false)

  const fetchAllData = useCallback(async () => {
    if (!user || !supabase || isFetching.current) {
      if (!user) {
        setProfile(null)
        setOrganization(null)
        setUserMode(null)
        setLoading(false)
      }
      return
    }

    isFetching.current = true
    setLoading(true)

    try {
      // ✅ PARALELO: Todas as queries ao mesmo tempo
      const [
        { data: dbProfile },
        { data: emails },
        { data: org },
        { data: pref }
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('user_emails')
          .select('id, email, is_primary, verified')
          .eq('user_id', user.id)
          .order('is_primary', { ascending: false }),
        supabase
          .from('organizations')
          .select('*')
          .eq('owner_id', user.id)
          .limit(1)
          .maybeSingle(),
        supabase
          .from('user_preferences')
          .select('user_mode')
          .eq('user_id', user.id)
          .maybeSingle()
      ])

      // Montar perfil
      const metadataAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture
      const dbAvatar = dbProfile?.avatar_url

      const userProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        name: dbProfile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || null,
        document: dbProfile?.document || null,
        document_type: dbProfile?.document_type || null,
        avatar_url: dbAvatar || metadataAvatar || null,
        is_super_admin: Boolean(dbProfile?.is_super_admin),
        emails: emails || [],
      }

      // Sync silencioso do avatar se necessário
      if (metadataAvatar && metadataAvatar !== dbAvatar) {
        updateProfile({ avatar_url: metadataAvatar }).catch(err => {
          console.error('Error syncing avatar to DB:', err)
        })
      }

      // Se não existe email primário na tabela, criar de forma silenciosa
      if (!emails || emails.length === 0) {
        try {
          const { data: newEmail } = await supabase
            .from('user_emails')
            .upsert({
              user_id: user.id,
              email: user.email,
              is_primary: true,
              verified: true,
              verified_at: new Date().toISOString(),
            }, { onConflict: 'email' })
            .select('id, email, is_primary, verified')
            .maybeSingle()

          if (newEmail) {
            userProfile.emails = [newEmail]
          }
        } catch (err) {
          console.warn('Silent email sync failed:', err)
        }
      }

      setProfile(userProfile)
      setOrganization(org || null)
      setUserMode(pref?.user_mode || null)

      // Salvar user_mode em cookie via API route (não espera, fire-and-forget)
      if (pref?.user_mode) {
        fetch('/api/set-user-mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userMode: pref.user_mode })
        }).catch(() => {})
      }

    } catch (error) {
      console.error('Error fetching app data:', error)
      setProfile(null)
      setOrganization(null)
      setUserMode(null)
    } finally {
      setLoading(false)
      isFetching.current = false
    }
  }, [user, supabase])

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }
    fetchAllData()
  }, [isConfigured, fetchAllData])

  const refresh = useCallback(async () => {
    isFetching.current = false
    await fetchAllData()
  }, [fetchAllData])

  return (
    <AppDataContext.Provider
      value={{
        profile,
        organization,
        userMode,
        loading: !isConfigured ? false : loading,
        refresh,
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const context = useContext(AppDataContext)
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider')
  }
  return context
}

// Hooks de compatibilidade (mantém API antiga funcionando)
export function useUser() {
  const { profile, loading, refresh } = useAppData()
  return { profile, loading, refresh }
}

export function useOrganization() {
  const { organization, loading, refresh } = useAppData()
  return { organization, loading, refresh }
}

export function useUserMode() {
  const { userMode, loading } = useAppData()
  return { userMode, loading }
}
