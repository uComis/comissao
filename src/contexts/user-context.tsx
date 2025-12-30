'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from './auth-context'
import { updateProfile } from '@/app/actions/profiles'

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

type UserContextType = {
  profile: UserProfile | null
  loading: boolean
  refresh: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, isConfigured } = useAuth()
  const supabase = createClient()
  const isFetching = useRef(false)

  const fetchProfile = useCallback(async () => {
    if (!user || !supabase || isFetching.current) {
      if (!user) {
        setProfile(null)
        setLoading(false)
      }
      return
    }

    isFetching.current = true
    setLoading(true)

    try {
      // Buscar dados do perfil (faturamento/documento)
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      // Buscar emails secundários
      const { data: emails } = await supabase
        .from('user_emails')
        .select('id, email, is_primary, verified')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })

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
        // Faz o update sem esperar para não travar o carregamento do perfil
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
          // Ignoramos erros de sync silencioso para não quebrar o app
          console.warn('Silent email sync failed:', err)
        }
      }

      setProfile(userProfile)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setProfile(null)
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
    fetchProfile()
  }, [isConfigured, fetchProfile])

  const refresh = useCallback(async () => {
    isFetching.current = false
    await fetchProfile()
  }, [fetchProfile])

  return (
    <UserContext.Provider value={{ profile, loading, refresh }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

