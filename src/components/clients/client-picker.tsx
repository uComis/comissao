'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, Package, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
  ItemSeparator,
} from '@/components/ui/item'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { getPersonalClients } from '@/app/actions/personal-clients'
import type { PersonalClient } from '@/types'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

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

  const listContent = (
    <>
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-[55px] shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-[200px]">
        {filteredClients.length > 0 ? (
          <div className="flex flex-col gap-2 px-[25px] py-2">
            {filteredClients.map((client) => (
                <Item
                  key={client.id}
                  variant="outline"
                  size="sm"
                  className={cn(
                    'cursor-pointer rounded-xl hover:bg-accent/50',
                    value === client.id && 'bg-accent'
                  )}
                  onClick={() => handleSelect(client)}
                >
                  <ItemMedia>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f59e0b]/15 text-xs font-semibold text-[#f59e0b]">
                      {getInitials(client.name)}
                    </span>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{client.name}</ItemTitle>
                    {(client.cpf || client.cnpj) && (
                      <ItemDescription>
                        {client.cpf ? `CPF: ${client.cpf}` : `CNPJ: ${client.cnpj}`}
                      </ItemDescription>
                    )}
                  </ItemContent>
                  <ItemActions>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpen(false)
                        onAddClick(client.name)
                      }}
                    >
                      Editar
                    </Button>
                  </ItemActions>
                </Item>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Nenhum registro encontrado</p>
          </div>
        )}
      </div>

      <div className="p-4">
        <Button
          type="button"
          onClick={handleAddNew}
          className="w-full h-12 gap-2 font-medium bg-foreground text-background hover:bg-foreground/90"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>
    </>
  )

  return (
    <>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        onClick={() => setOpen(true)}
        disabled={loading}
        className={cn(
          'h-[60px] justify-between font-normal w-full rounded-xl bg-muted/30',
          !displayValue && 'text-muted-foreground',
          className
        )}
      >
        <span className="flex items-center gap-3 truncate">
          {loading ? (
            'Carregando...'
          ) : displayValue ? (
            <>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f59e0b]/15 text-sm font-semibold text-[#f59e0b]">
                {getInitials(displayValue)}
              </span>
              <span className="font-medium text-foreground">{displayValue}</span>
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-full h-full flex flex-col p-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <SheetHeader className="px-5 py-4">
              <SheetTitle className="text-lg">Selecionar Cliente</SheetTitle>
            </SheetHeader>
            {listContent}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
            <DialogHeader className="px-5 py-4">
              <DialogTitle className="text-lg">Selecionar Cliente</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col max-h-[60vh]">
              {listContent}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
