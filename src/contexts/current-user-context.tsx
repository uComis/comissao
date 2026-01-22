'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { getCurrentUser, type CurrentUser } from '@/app/actions/user'

type CurrentUserContextType = {
  currentUser: CurrentUser | null
  loading: boolean
  refresh: () => Promise<void>
}

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined)

type CurrentUserProviderProps = {
  children: React.ReactNode
  initialData: CurrentUser | null
}

export function CurrentUserProvider({ children, initialData }: CurrentUserProviderProps) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(initialData)
  const [loading, setLoading] = useState(false)
  const isFetching = useRef(false)

  const refresh = useCallback(async () => {
    if (isFetching.current) return
    
    isFetching.current = true
    setLoading(true)

    try {
      const user = await getCurrentUser()
      setCurrentUser(user)
    } catch (error) {
      console.error('Error refreshing current user:', error)
    } finally {
      setLoading(false)
      isFetching.current = false
    }
  }, [])

  return (
    <CurrentUserContext.Provider value={{ currentUser, loading, refresh }}>
      {children}
    </CurrentUserContext.Provider>
  )
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext)
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider')
  }
  return context
}
