'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ExternalLink, CheckCircle2 } from 'lucide-react'

interface PaymentBridgeModalProps {
  invoiceId?: string
  invoiceUrl?: string
}

export function PaymentBridgeModal({ invoiceId: initialInvoiceId, invoiceUrl: initialInvoiceUrl }: PaymentBridgeModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(initialInvoiceUrl || null)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const invId = searchParams.get('invoice_id')
    const invUrl = searchParams.get('url')

    if (invId || initialInvoiceId) {
      const timeout = setTimeout(() => {
        setIsOpen(true)
        if (invUrl) setInvoiceUrl(decodeURIComponent(invUrl))
      }, 0)
      return () => clearTimeout(timeout)
    }
  }, [searchParams, initialInvoiceId, initialInvoiceUrl])

  const handleOpenPayment = () => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank')
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    // Limpa os params da URL sem recarregar a página
    const params = new URLSearchParams(searchParams.toString())
    params.delete('invoice_id')
    params.delete('url')
    router.replace(`/cobrancas?${params.toString()}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Cobrança Gerada!</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Sua fatura segura já está pronta no Asaas. Clique no botão abaixo para abrir a página de pagamento.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20 text-center my-4">
          <p className="text-sm text-muted-foreground mb-1">Status</p>
          <p className="font-semibold text-primary uppercase tracking-wider">Aguardando Pagamento</p>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Ambiente de pagamento 100% seguro
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Liberação imediata após o pagamento
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Suporte a PIX, Cartão e Boleto
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2 mt-6">
          <Button onClick={handleOpenPayment} className="w-full gap-2 text-base h-12" size="lg">
            Ir para Pagamento Seguro
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button variant="ghost" onClick={handleClose} className="w-full text-muted-foreground">
            Ver minhas faturas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

