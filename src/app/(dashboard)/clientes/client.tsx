'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ClientTable } from '@/components/clients/client-table'
import { ClientDialog } from '@/components/clients/client-dialog'
import { PageHeader } from '@/components/layout'
import type { PersonalClient } from '@/types'

type Props = {
  initialClients: PersonalClient[]
}

export function ClientesClient({ initialClients }: Props) {
  const [clients, setClients] = useState<PersonalClient[]>(initialClients)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<PersonalClient | null>(null)

  function handleNewClient() {
    setEditingClient(null)
    setDialogOpen(true)
  }

  function handleEdit(client: PersonalClient) {
    setEditingClient(client)
    setDialogOpen(true)
  }

  function handleSuccess(client: PersonalClient) {
    if (editingClient) {
      // Atualizando cliente existente
      setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)))
    } else {
      // Novo cliente
      setClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)))
    }
  }

  function handleDeleted(clientId: string) {
    setClients((prev) => prev.filter((c) => c.id !== clientId))
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Meus Clientes" 
        description="Gerencie sua carteira de clientes"
      >
        <Button onClick={handleNewClient}>
          <Plus className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Novo Cliente</span>
        </Button>
      </PageHeader>

      <ClientTable
        clients={clients}
        onEdit={handleEdit}
        onDeleted={handleDeleted}
      />

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editingClient}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

