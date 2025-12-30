'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Pencil, Trash2, Mail, Phone, Calendar, FileText } from 'lucide-react'
import { deletePersonalClient } from '@/app/actions/personal-clients'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import type { PersonalClient } from '@/types'

type Props = {
  clients: PersonalClient[]
  onEdit: (client: PersonalClient) => void
  onDeleted: (clientId: string) => void
}

export function ClientTable({ clients, onEdit, onDeleted }: Props) {
  const isMobile = useIsMobile()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  function formatCpf(cpf: string): string {
    return cpf
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  function formatCnpj(cnpj: string): string {
    return cnpj
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }

  function formatPhone(phone: string): string {
    const numbers = phone.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  function getDocument(client: PersonalClient): string {
    if (client.cpf) return formatCpf(client.cpf)
    if (client.cnpj) return formatCnpj(client.cnpj)
    return '—'
  }

  function getWhatsAppLink(phone: string): string {
    const numbers = phone.replace(/\D/g, '')
    // Adiciona 55 (Brasil) se não tiver código do país
    const fullNumber = numbers.length <= 11 ? `55${numbers}` : numbers
    return `https://wa.me/${fullNumber}`
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  async function handleDelete() {
    if (!deleteId) return

    setDeleting(true)
    try {
      const result = await deletePersonalClient(deleteId)
      if (result.success) {
        toast.success('Cliente excluído')
        onDeleted(deleteId)
      } else {
        toast.error(result.error)
      }
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">Nenhum cliente cadastrado.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Clique em &quot;Novo Cliente&quot; para começar.
        </p>
      </div>
    )
  }

  const ActionMenu = ({ client }: { client: PersonalClient }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(client)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setDeleteId(client.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const DeleteDialog = () => (
    <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. O cliente será removido da sua carteira.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  // Mobile: Cards view
  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Nome */}
                  <div className="font-medium truncate">
                    {client.name}
                  </div>

                  {/* Documento */}
                  {(client.cpf || client.cnpj) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-mono text-xs">{getDocument(client)}</span>
                    </div>
                  )}

                  {/* Telefone */}
                  {client.phone && (
                    <a
                      href={getWhatsAppLink(client.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://cdn-icons-png.flaticon.com/16/5968/5968841.png"
                        alt="WhatsApp"
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-xs">{formatPhone(client.phone)}</span>
                    </a>
                  )}

                  {/* Email */}
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs truncate">{client.email}</span>
                    </div>
                  )}

                  {/* Data de cadastro */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Calendar className="h-3 w-3" />
                    <span className="font-mono">{formatDate(client.created_at)}</span>
                  </div>
                </div>

                {/* Menu de ações */}
                <div className="-mr-2 -mt-1" onClick={(e) => e.stopPropagation()}>
                  <ActionMenu client={client} />
                </div>
              </div>
            </Card>
          ))}
        </div>
        <DeleteDialog />
      </>
    )
  }

  // Desktop: Table view
  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">
                  {getDocument(client)}
                </TableCell>
                <TableCell>
                  {client.phone ? (
                    <a
                      href={getWhatsAppLink(client.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      title="Abrir no WhatsApp"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://cdn-icons-png.flaticon.com/16/5968/5968841.png"
                        alt="WhatsApp"
                        className="h-4 w-4"
                      />
                      {formatPhone(client.phone)}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {client.email ? (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {client.email}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(client.created_at)}
                </TableCell>
                <TableCell>
                  <ActionMenu client={client} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DeleteDialog />
    </>
  )
}
