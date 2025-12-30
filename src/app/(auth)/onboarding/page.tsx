'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase'
import { setupTrialSubscription } from '@/app/actions/billing'
import { toast } from 'sonner'
import { Loader2, User, Building2 } from 'lucide-react'

export default function OnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<'personal' | 'organization' | null>(null)
  const isOrganizationEnabled = process.env.NEXT_PUBLIC_ENABLE_ORGANIZATION === 'true'

  const handleSelectMode = useCallback(async (mode: 'personal' | 'organization') => {
    if (!user) return

    setLoading(mode)
    const supabase = createClient()
    if (!supabase) {
      toast.error('Erro ao conectar com o servidor')
      setLoading(null)
      return
    }

    try {
      // 1. Criar assinatura trial e usage_stats primeiro (Server Action)
      await setupTrialSubscription(user.id)

      // 2. Salvar preferência do usuário
      const { error: prefError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          user_mode: mode,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (prefError) {
        console.error('Error saving preference:', prefError)
        toast.error('Erro ao salvar preferência')
        setLoading(null)
        return
      }

      // Se escolheu organização, criar organização
      if (mode === 'organization') {
        const orgName = user.user_metadata?.full_name 
          || user.user_metadata?.name 
          || user.email?.split('@')[0] 
          || 'Minha Organização'

        const { error: orgError } = await supabase
          .from('organizations')
          .upsert({
            name: orgName,
            owner_id: user.id,
            email: user.email,
          }, { onConflict: 'owner_id', ignoreDuplicates: true })

        if (orgError) {
          console.error('Error creating organization:', orgError)
          toast.error('Erro ao criar organização')
          setLoading(null)
          return
        }
      }

      // Redirecionar para dashboard apropriado
      if (mode === 'personal') {
        router.push('/home')
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error('Erro inesperado')
      setLoading(null)
    }
  }, [user, router])

  useEffect(() => {
    // Se houver erro na URL ou no fragmento, não redireciona automaticamente 
    // para garantir que o erro seja processado e exibido
    const hasError = window.location.search.includes('error') || window.location.hash.includes('error')
    
    // Se o modo organização estiver desabilitado, seleciona 'personal' automaticamente
    if (!isOrganizationEnabled && user && !loading && !hasError) {
      handleSelectMode('personal')
    }
  }, [isOrganizationEnabled, user, handleSelectMode, loading])

  if (!isOrganizationEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground text-center">Configurando sua conta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Como deseja usar o uComis?</CardTitle>
          <CardDescription>
            Escolha o modo que melhor se adapta ao seu perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            onClick={() => handleSelectMode('personal')}
            disabled={loading !== null}
            className="w-full p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                {loading === 'personal' ? (
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                ) : (
                  <User className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Sou Vendedor / Representante</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Quero controlar minhas comissões pessoais, registrar vendas e acompanhar meus recebíveis.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleSelectMode('organization')}
            disabled={loading !== null}
            className="w-full p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                {loading === 'organization' ? (
                  <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                ) : (
                  <Building2 className="h-6 w-6 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Gerencio uma Equipe Comercial</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Quero calcular comissões da minha equipe, definir regras e acompanhar resultados.
                </p>
              </div>
            </div>
          </button>

          <p className="text-xs text-center text-muted-foreground pt-4">
            Você poderá alterar isso depois nas configurações.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

