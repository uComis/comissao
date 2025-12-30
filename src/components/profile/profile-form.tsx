'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getProfile, updateProfile } from '@/app/actions/profiles'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { useUser } from '@/contexts/user-context'

interface ProfileFormProps {
  onSuccess?: () => void
}

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const { refresh } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [document, setDocument] = useState('')

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile()
        if (data) {
          setFullName(data.full_name || '')
          setDocument(formatDocument(data.document || ''))
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const formatDocument = (value: string) => {
    if (!value) return ''
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1')
    } else {
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
    
    if (digits && digits.length !== 11 && digits.length !== 14) {
      toast.error('Documento inválido. Informe um CPF ou CNPJ válido.')
      return
    }

    setSaving(true)
    try {
      await updateProfile({
        full_name: fullName,
        document: digits,
        document_type: digits ? (digits.length === 11 ? 'CPF' : 'CNPJ') : undefined,
      })
      toast.success('Perfil atualizado com sucesso!')
      await refresh()
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar perfil'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nome Completo (ou Razão Social)</Label>
        <Input
          id="fullName"
          placeholder="Ex: João Silva ou Empresa Ltda"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="document">CPF ou CNPJ</Label>
        <Input
          id="document"
          placeholder="000.000.000-00"
          value={document}
          onChange={handleDocumentChange}
        />
      </div>
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Salvar Alterações
          </>
        )}
      </Button>
    </form>
  )
}

