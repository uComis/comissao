'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile } from '@/app/actions/profiles'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ProfileCompletionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ProfileCompletionDialog({
  open,
  onOpenChange,
  onSuccess,
}: ProfileCompletionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [document, setDocument] = useState('')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const digits = document.replace(/\D/g, '')
    
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
      await updateProfile({
        full_name: fullName,
        document: digits,
        document_type: digits.length === 11 ? 'CPF' : 'CNPJ',
      })
      toast.success('Perfil atualizado com sucesso!')
      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar perfil'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete seu cadastro</DialogTitle>
          <DialogDescription>
            Para efetuar uma assinatura, precisamos de alguns dados adicionais para a emissão das faturas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo (ou Razão Social)</Label>
            <Input
              id="fullName"
              placeholder="Ex: João Silva ou Empresa Ltda"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="document">CPF ou CNPJ</Label>
            <Input
              id="document"
              placeholder="000.000.000-00"
              value={document}
              onChange={handleDocumentChange}
              required
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar e Continuar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

