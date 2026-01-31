'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, ChevronDown } from 'lucide-react'
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
import { getPersonalClients } from '@/app/actions/personal-clients'
import type { PersonalClient } from '@/types'

type Props = {
  value: string | null
  onChange: (clientId: string | null, clientName: string) => void
  placeholder?: string
  className?: string
  refreshTrigger?: number // incrementar para forçar refresh da lista
}

export function ClientCombobox({
  value,
  onChange,
  placeholder = 'Selecionar cliente...',
  className,
  refreshTrigger = 0,
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState<PersonalClient[]>([])
  const [loading, setLoading] = useState(true)

  const loadClients = useCallback(async () => {
    try {
      const data = await getPersonalClients()
      setClients(data)
    } catch (err) {
      console.error('Error loading clients:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadClients()
  }, [loadClients, refreshTrigger])

  const selectedClient = clients.find((c) => c.id === value)
  const displayValue = selectedClient?.name || ''

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(client: PersonalClient) {
    onChange(client.id, client.name)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between font-normal', className)}
          disabled={loading}
        >
          <span className={cn('truncate', !displayValue && 'text-muted-foreground')}>
            {loading ? 'Carregando...' : displayValue || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
            {filteredClients.length === 0 && (
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
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
