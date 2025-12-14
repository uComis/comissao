'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ClientDialog } from './client-dialog'
import { getPersonalClients } from '@/app/actions/personal-clients'
import type { PersonalClient } from '@/types'

type Props = {
  value: string | null // client_id
  onChange: (clientId: string | null, clientName: string) => void
  placeholder?: string
  className?: string
}

export function ClientCombobox({
  value,
  onChange,
  placeholder = 'Selecionar cliente...',
  className,
}: Props) {
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState<PersonalClient[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingName, setPendingName] = useState('')

  // Carregar clientes
  useEffect(() => {
    async function load() {
      try {
        const data = await getPersonalClients()
        setClients(data)
      } catch (err) {
        console.error('Error loading clients:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const selectedClient = clients.find((c) => c.id === value)
  const displayValue = selectedClient?.name || ''

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const showCreateOption =
    search.trim() !== '' &&
    !filteredClients.some(
      (c) => c.name.toLowerCase() === search.toLowerCase()
    )

  function handleSelect(client: PersonalClient) {
    onChange(client.id, client.name)
    setOpen(false)
    setSearch('')
  }

  function handleCreateNew() {
    setPendingName(search.trim())
    setOpen(false)
    setDialogOpen(true)
  }

  function handleClientCreated(client: PersonalClient) {
    setClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)))
    onChange(client.id, client.name)
    setSearch('')
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('justify-between font-normal', className)}
            disabled={loading}
          >
            <span className="truncate">
              {loading ? 'Carregando...' : displayValue || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Pesquisar cliente..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {filteredClients.length === 0 && !showCreateOption && (
                <CommandEmpty>Nenhum cliente encontrado</CommandEmpty>
              )}
              <CommandGroup>
                {filteredClients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={() => handleSelect(client)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === client.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{client.name}</span>
                      {(client.cpf || client.cnpj) && (
                        <span className="text-xs text-muted-foreground">
                          {client.cpf ? `CPF: ${client.cpf}` : `CNPJ: ${client.cnpj}`}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
                {showCreateOption && (
                  <CommandItem onSelect={handleCreateNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Criar cliente: </span>
                    <span className="font-medium ml-1">{search}</span>
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialName={pendingName}
        onSuccess={handleClientCreated}
      />
    </>
  )
}

