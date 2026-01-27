'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, ChevronDown, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { getPersonalClients } from '@/app/actions/personal-clients'
import type { PersonalClient } from '@/types'

type Props = {
  value: string | null
  onChange: (clientId: string | null, clientName: string) => void
  onAddClick: (initialName?: string) => void
  placeholder?: string
  className?: string
  refreshTrigger?: number
}

export function ClientPicker({
  value,
  onChange,
  onAddClick,
  placeholder = 'Selecionar cliente...',
  className,
  refreshTrigger = 0,
}: Props) {
  const isMobile = useIsMobile()
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

  function handleAddNew() {
    const nameToPass = search.trim() || undefined
    setOpen(false)
    setSearch('')
    onAddClick(nameToPass)
  }

  // Mobile: Drawer fullscreen
  if (isMobile) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          onClick={() => setOpen(true)}
          disabled={loading}
          className={cn(
            'h-12 justify-between font-normal w-full',
            !displayValue && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">
            {loading ? 'Carregando...' : displayValue || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent 
            side="right" 
            className="w-full sm:max-w-full h-full flex flex-col p-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle>Selecionar Cliente</SheetTitle>
            </SheetHeader>

            {/* Search Input */}
            <div className="px-4 py-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-12"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto">
              {/* Create New Option */}
              {search && filteredClients.length === 0 ? (
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="w-full px-4 py-4 text-left flex items-center gap-3 hover:bg-muted transition-colors text-primary font-medium"
                >
                  <Plus className="h-5 w-5" />
                  <span>Criar &quot;{search}&quot;</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleAddNew}
                    className="w-full px-4 py-4 text-left flex items-center gap-3 hover:bg-muted transition-colors border-b text-primary"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Novo Cliente</span>
                  </button>

                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelect(client)}
                      className={cn(
                        'w-full px-4 py-4 text-left flex items-center gap-3 hover:bg-muted transition-colors border-b',
                        value === client.id && 'bg-muted'
                      )}
                    >
                      <Check
                        className={cn(
                          'h-5 w-5 text-primary shrink-0',
                          value === client.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">{client.name}</span>
                        {(client.cpf || client.cnpj) && (
                          <span className="text-xs text-muted-foreground">
                            {client.cpf ? `CPF: ${client.cpf}` : `CNPJ: ${client.cnpj}`}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </>
              )}

              {filteredClients.length === 0 && !search && (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum cliente cadastrado
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Desktop: Select + Button
  return (
    <div className={cn('flex gap-2', className)}>
      <Select
        value={value || ''}
        onValueChange={(val) => {
          const client = clients.find((c) => c.id === val)
          if (client) {
            onChange(client.id, client.name)
          }
        }}
        disabled={loading}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={loading ? 'Carregando...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {clients.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhum cliente encontrado
            </div>
          ) : (
            clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onAddClick()}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}

