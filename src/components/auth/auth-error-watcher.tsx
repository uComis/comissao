'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { toast } from 'sonner'

export function AuthErrorWatcher() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Garante que estamos no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Pequeno delay para garantir que o hash está disponível após navegação
    const timeoutId = setTimeout(() => {
      // 1. Pega erro da query string
      const error = searchParams.get('error')
      const message = searchParams.get('message')
      
      // 2. Pega erro do fragmento (#) que o Supabase envia
      const hash = window.location.hash
      const hashParams = new URLSearchParams(hash.substring(1))
      const errorCode = hashParams.get('error_code')
      const errorDescription = hashParams.get('error_description')
      const hashError = hashParams.get('error')

      console.log('[AuthErrorWatcher] Verificando erros:', { 
        error, 
        errorCode, 
        errorDescription, 
        hash,
        hashError,
        pathname 
      })

      // Verifica qualquer condição de erro de auth
      const hasAuthError = 
        error === 'auth_callback' || 
        error === 'auth' || 
        errorCode === 'identity_already_exists' ||
        hashError === 'server_error' ||
        (hash && hash.includes('error'))

      if (hasAuthError) {
        let finalMessage = ''
        
        if (errorCode === 'identity_already_exists' || errorDescription?.includes('already linked')) {
          finalMessage = 'Esta conta já está vinculada a outro usuário. Use a conta original para fazer login.'
        } else if (message) {
          finalMessage = decodeURIComponent(message.replace(/\+/g, ' '))
        } else if (errorDescription) {
          finalMessage = decodeURIComponent(errorDescription.replace(/\+/g, ' '))
        } else if (error === 'auth' || hashError === 'server_error') {
          finalMessage = 'Falha na autenticação. Verifique se a conta já está em uso.'
        }

        if (finalMessage) {
          console.log('[AuthErrorWatcher] Exibindo toast:', finalMessage)
          toast.error(finalMessage, { 
            duration: 8000,
            id: 'auth-error-' + (errorCode || hashError || 'generic')
          })
        }
        
        // Limpa a URL e o fragmento silenciosamente
        window.history.replaceState(null, '', pathname)
      }
    }, 100) // Pequeno delay para garantir que hash está disponível

    return () => clearTimeout(timeoutId)
  }, [mounted, searchParams, pathname])

  // Também escuta mudanças no hash diretamente
  useEffect(() => {
    if (!mounted) return

    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash && hash.includes('error')) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const errorCode = hashParams.get('error_code')
        const errorDescription = hashParams.get('error_description')

        if (errorCode === 'identity_already_exists' || errorDescription?.includes('already linked')) {
          toast.error('Esta conta já está vinculada a outro usuário. Use a conta original para fazer login.', { 
            duration: 8000,
            id: 'auth-error-identity'
          })
          window.history.replaceState(null, '', pathname)
        }
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    
    // Também verifica imediatamente ao montar
    handleHashChange()

    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [mounted, pathname])

  return null
}

