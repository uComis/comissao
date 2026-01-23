'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, ShieldCheck, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/auth-context'
import { useCurrentUser } from '@/contexts/current-user-context'
import { createSubscription } from '@/app/actions/billing'
import { updateProfile } from '@/app/actions/profiles'
import { toast } from 'sonner'

interface PlanInfo {
  id: string
  name: string
  price: number
  interval: string
  planGroup: string
}

export function ConfirmarPlanoClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { currentUser, refresh } = useCurrentUser()

  const [loading, setLoading] = useState(false)
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)
  const [fullName, setFullName] = useState('')
  const [document, setDocument] = useState('')

  // Carregar dados do plano da URL e pré-preencher nome/documento
  useEffect(() => {
    const planId = searchParams.get('plan_id')
    const planName = searchParams.get('plan_name')
    const planPrice = searchParams.get('plan_price')
    const planInterval = searchParams.get('plan_interval')
    const planGroup = searchParams.get('plan_group')

    if (!planId || !planName || !planPrice || !planInterval || !planGroup) {
      toast.error('Plano não encontrado. Redirecionando...')
      router.push('/planos')
      return
    }

    setPlanInfo({
      id: planId,
      name: planName,
      price: parseFloat(planPrice),
      interval: planInterval,
      planGroup: planGroup,
    })

    // Pré-preencher com dados existentes
    if (currentUser?.full_name) {
      setFullName(currentUser.full_name)
    }
    if (currentUser?.document) {
      setDocument(formatDocument(currentUser.document))
    }
  }, [searchParams, currentUser, router])

  const formatDocument = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 11) {
      // CPF: 000.000.000-00
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1')
    } else {
      // CNPJ: 00.000.000/0000-00
      return digits
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1')
    }
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocument(formatDocument(e.target.value))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !planInfo) return

    const digits = document.replace(/\D/g, '')

    // Validações
    if (digits.length !== 11 && digits.length !== 14) {
      toast.error('Documento inválido. Informe um CPF ou CNPJ válido.')
      return
    }

    if (fullName.trim().split(' ').length < 2) {
      toast.error('Informe seu nome completo.')
      return
    }

    setLoading(true)

    try {
      // 1. Atualizar perfil se necessário
      const needsUpdate =
        currentUser?.full_name !== fullName || currentUser?.document !== digits

      if (needsUpdate) {
        await updateProfile({
          full_name: fullName,
          document: digits,
          document_type: digits.length === 11 ? 'CPF' : 'CNPJ',
        })
        await refresh()
      }

      // 2. Criar assinatura
      const result = await createSubscription(
        user.id,
        planInfo.planGroup as 'pro' | 'ultra',
        planInfo.interval === 'year'
      )

      if (result.success) {
        toast.success('Fatura gerada! Redirecionando para pagamento...')

        const params = new URLSearchParams()
        if (result.invoiceId) params.append('invoice_id', result.invoiceId)
        if (result.invoiceUrl) params.append('url', result.invoiceUrl)

        window.location.href = `/cobrancas?${params.toString()}`
      } else {
        throw new Error(result.message || 'Erro ao criar assinatura.')
      }
    } catch (error) {
      console.error('Erro ao confirmar:', error)
      const message =
        error instanceof Error
          ? error.message
          : 'Erro ao processar assinatura. Tente novamente.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (!planInfo) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/planos')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold">Confirmar Assinatura</h1>
          <p className="text-muted-foreground mt-2">
            Revise os dados e confirme sua assinatura
          </p>
        </div>
      </div>

      {/* Plan Summary Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Resumo do Plano
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Plano selecionado</span>
            <span className="font-semibold">{planInfo.name}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Ciclo de cobrança</span>
            <span className="font-semibold">
              {planInfo.interval === 'year' ? 'Anual' : 'Mensal'}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium">Valor</span>
            <span className="font-bold text-primary">
              {planInfo.interval === 'year'
                ? `${formatPrice(planInfo.price / 12)}/mês (cobrado ${formatPrice(planInfo.price)} anualmente)`
                : `${formatPrice(planInfo.price)}/mês`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Customer Data Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Dados para Faturamento
          </CardTitle>
          <CardDescription>
            Essas informações serão usadas para emitir suas faturas
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleConfirm}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo (ou Razão Social)</Label>
              <Input
                id="fullName"
                placeholder="Ex: João Silva ou Empresa Ltda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document">CPF ou CNPJ</Label>
              <Input
                id="document"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={document}
                onChange={handleDocumentChange}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/planos')}
              disabled={loading}
              className="flex-1"
            >
              Voltar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar e Pagar'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border/40">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">
            Seus dados estão seguros
          </p>
          <p>
            Utilizamos o Asaas, uma das maiores e mais seguras plataformas de
            pagamento do Brasil. Seus dados são criptografados e protegidos.
          </p>
        </div>
      </div>
    </div>
  )
}
