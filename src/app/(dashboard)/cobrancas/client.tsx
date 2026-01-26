'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Receipt, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PaymentBridgeModal } from '@/components/billing/payment-bridge-modal'
import { CancelSubscriptionModal } from '@/components/billing/cancel-subscription-modal'
import { useCurrentUser } from '@/contexts/current-user-context'

interface Invoice {
  id: string
  status: string
  value: number
  dueDate: string
  invoiceUrl: string
  description?: string
}

interface CobrancasClientProps {
  initialInvoices: Invoice[]
}

export function CobrancasClient({ initialInvoices }: CobrancasClientProps) {
  const [invoices] = useState<Invoice[]>(initialInvoices)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const { currentUser, refresh } = useCurrentUser()

  const billing = currentUser?.billing
  const hasPaidPlan = billing?.planGroup && billing.planGroup !== 'free'
  const isCanceling = billing?.cancelAtPeriodEnd

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none flex w-fit items-center gap-1"><Clock className="w-3 h-3" /> Pendente</Badge>
      case 'RECEIVED':
      case 'CONFIRMED':
      case 'RECEIVED_IN_CASH':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 border-none flex w-fit items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Pago</Badge>
      case 'OVERDUE':
        return <Badge variant="destructive" className="flex w-fit items-center gap-1"><AlertCircle className="w-3 h-3" /> Vencido</Badge>
      case 'REFUNDED':
        return <Badge variant="outline" className="text-muted-foreground">Estornado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const hasPending = invoices.some(i => i.status === 'PENDING')

  return (
    <div className="space-y-8">
      <PaymentBridgeModal />

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturas</CardTitle>
          <CardDescription>
            Todas as suas cobranças geradas pelo sistema através do Asaas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="py-12 text-center">
              <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhuma fatura encontrada</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Assim que você realizar seu primeiro upgrade, as faturas aparecerão aqui.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {format(new Date(invoice.dueDate), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {invoice.description || 'Assinatura uComis'}
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.value)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="gap-2"
                      >
                        <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer">
                          Ver Fatura
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {hasPending && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-full hidden sm:block">
              <Receipt className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-lg text-primary">Você possui pagamento pendente</h4>
              <p className="text-muted-foreground text-sm max-w-md">
                Para evitar interrupções no seu acesso e liberar todos os recursos do seu novo plano, realize o pagamento da fatura aberta.
              </p>
            </div>
          </div>
          <Button size="lg" className="w-full md:w-auto" asChild>
            <a href={invoices.find(i => i.status === 'PENDING')?.invoiceUrl} target="_blank" rel="noopener noreferrer">
              Pagar agora
            </a>
          </Button>
        </div>
      )}

      {/* Cancel Subscription Section */}
      {hasPaidPlan && !isCanceling && (
        <div className="border-t pt-8 mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Gerenciar assinatura</h4>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Você pode cancelar sua assinatura a qualquer momento
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setCancelModalOpen(true)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancelar assinatura
            </Button>
          </div>
        </div>
      )}

      {/* Cancellation Info */}
      {isCanceling && billing?.currentPeriodEnd && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mt-8">
          <div className="flex items-start gap-4">
            <div className="bg-amber-100 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-lg text-amber-900">Assinatura marcada para cancelamento</h4>
              <p className="text-amber-700 text-sm mt-1">
                Seu acesso ao plano {billing.planGroup?.toUpperCase()} continua até{' '}
                <strong>{format(new Date(billing.currentPeriodEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>.
                Após essa data, você voltará para o plano Free.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        currentPlan={billing?.planGroup?.toUpperCase() || 'Atual'}
        periodEnd={billing?.currentPeriodEnd || null}
        onSuccess={() => {
          refresh?.()
        }}
      />
    </div>
  )
}

