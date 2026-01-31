'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronLeft, Package, Pencil, Plus, Search, Loader2, Check } from 'lucide-react'
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
} from '@/components/ui/item'
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { getPersonalClients, createPersonalClient, updatePersonalClient } from '@/app/actions/personal-clients'
import { toast } from 'sonner'
import { ClientForm, type ClientFormRef } from './client-form'
import { ClientDialog } from './client-dialog'
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
  onAddClick?: () => void
  label?: string
  placeholder?: string
  className?: string
  refreshTrigger?: number
}

export function ClientPicker({
  value,
  onChange,
  onAddClick,
  label = 'Cliente',
  placeholder = 'Selecionar cliente',
  className,
  refreshTrigger = 0,
}: Props) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState<PersonalClient[]>([])
  const [loadingClients, setLoadingClients] = useState(true)

  // Mobile sliding state
  const [view, setView] = useState<'list' | 'form'>('list')
  const clientFormRef = useRef<ClientFormRef>(null)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Desktop dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogEditingClient, setDialogEditingClient] = useState<PersonalClient | null>(null)

  const loadClients = useCallback(async () => {
    try {
      const data = await getPersonalClients()
      setClients(data)
    } catch (err) {
      console.error('Error loading clients:', err)
    } finally {
      setLoadingClients(false)
    }
  }, [])

  useEffect(() => {
    loadClients()
  }, [loadClients, refreshTrigger])

  // Reset view when sheet opens
  useEffect(() => {
    if (open) {
      setView('list')
      setSearch('')
      resetForm()
    }
  }, [open])

  const selectedClient = clients.find((c) => c.id === value)
  const displayValue = selectedClient?.name || ''

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  function resetForm() {
    setEditingClientId(null)
    clientFormRef.current?.reset()
    setSaving(false)
  }

  function handleSelect(client: PersonalClient) {
    onChange(client.id, client.name)
    setOpen(false)
    setSearch('')
  }

  // --- Mobile handlers ---
  function handleNavigateToForm(client?: PersonalClient) {
    if (client) {
      setEditingClientId(client.id)
      clientFormRef.current?.reset({
        name: client.name,
        cpf: client.cpf || '',
        cnpj: client.cnpj || '',
        phone: client.phone || '',
        email: client.email || '',
        notes: client.notes || '',
        documentType: client.cpf ? 'cpf' : 'cnpj',
      })
    } else {
      setEditingClientId(null)
      clientFormRef.current?.reset({ name: search.trim() || '' })
    }
    setView('form')
  }

  function handleBack() {
    setView('list')
    resetForm()
  }

  async function handleMobileSubmit(e?: React.FormEvent) {
    e?.preventDefault()

    if (!clientFormRef.current?.validate()) {
      toast.error('Nome é obrigatório')
      return
    }

    setSaving(true)

    try {
      const data = clientFormRef.current.getData()

      const payload = {
        name: data.name,
        cpf: data.cpf || null,
        cnpj: data.cnpj || null,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
      }

      if (editingClientId) {
        const result = await updatePersonalClient(editingClientId, payload)

        if (result.success) {
          toast.success('Cliente atualizado')
          onChange(result.data.id, result.data.name)
          loadClients()
          setOpen(false)
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createPersonalClient(payload)

        if (result.success) {
          toast.success('Cliente cadastrado')
          onChange(result.data.id, result.data.name)
          loadClients()
          setOpen(false)
        } else {
          toast.error(result.error)
        }
      }
    } finally {
      setSaving(false)
    }
  }

  // --- Desktop dialog handlers ---
  function handleDialogOpen(client: PersonalClient) {
    setDialogEditingClient(client)
    setOpen(false)
    setSearch('')
    setDialogOpen(true)
  }

  function handleAddNew() {
    setDialogEditingClient(null)
    setOpen(false)
    setSearch('')
    if (onAddClick) {
      onAddClick()
    } else {
      setDialogOpen(true)
    }
  }

  function handleDialogSuccess(client: PersonalClient) {
    onChange(client.id, client.name)
    loadClients()
  }

  // --- Mobile: Bottom drawer with sliding content ---
  if (isMobile) {
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
                  </ItemContent>
                  <ItemActions>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNavigateToForm(client)
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
      </>
    )

    const formContent = (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto px-5 py-4">
          <ClientForm
            ref={clientFormRef}
            autoFocus={false}
          />
        </div>
      </div>
    )

    const renderSlidingContent = (containerClass: string) => (
      <div className={cn("flex flex-col", containerClass)}>
        <div className="relative flex-1 overflow-hidden">
          <div
            className="flex h-full w-[200%] transition-transform duration-300 ease-in-out"
            style={{ transform: view === 'form' ? 'translateX(-50%)' : 'translateX(0)' }}
          >
            <div className="w-1/2 flex flex-col h-full overflow-hidden">
              {listContent}
            </div>
            <div className="w-1/2 flex flex-col h-full overflow-hidden">
              {formContent}
            </div>
          </div>
        </div>
        <div className="shrink-0 p-4 border-t">
          {view === 'list' ? (
            <Button
              type="button"
              onClick={() => handleNavigateToForm()}
              variant="outline"
              className="w-full h-12 gap-2 font-medium"
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-12 font-medium"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => handleMobileSubmit()}
                disabled={saving}
                className="flex-1 h-12 gap-2 font-medium bg-foreground text-background hover:bg-foreground/90"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Salvar
              </Button>
            </div>
          )}
        </div>
      </div>
    )

    return (
      <>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          onClick={() => setOpen(true)}
          disabled={loadingClients}
          className={cn(
            'h-auto min-h-[60px] justify-between font-normal w-full rounded-xl bg-white !p-[15px]',
            !displayValue && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex flex-col items-start gap-0.5 truncate">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <span className="flex items-center gap-3 truncate">
              {loadingClients ? (
                'Carregando...'
              ) : displayValue ? (
                <span className="font-medium text-foreground">{displayValue}</span>
              ) : (
                <span className="text-muted-foreground/60">{placeholder}</span>
              )}
            </span>
          </div>
          <ChevronDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
        </Button>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[85vh] flex flex-col p-0">
            <DrawerHeader className="shrink-0 flex flex-row items-center px-5 text-left">
              <DrawerTitle className="text-lg flex items-center gap-2">
                {view === 'form' && (
                  <button type="button" onClick={handleBack} className="hover:opacity-70 transition-opacity">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                {view === 'list' ? 'Selecionar Cliente' : editingClientId ? 'Editar Cliente' : 'Novo Cliente'}
              </DrawerTitle>
            </DrawerHeader>
            {renderSlidingContent("flex-1 overflow-hidden")}
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  // --- Desktop: Combobox select + ClientDialog modal ---
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={loadingClients}
            className={cn(
              'h-auto min-h-[60px] justify-between font-normal w-full rounded-xl bg-white !p-[15px]',
              !displayValue && 'text-muted-foreground',
              className
            )}
          >
            <div className="flex flex-col items-start gap-0.5 truncate">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <span className="flex items-center gap-3 truncate">
                {loadingClients ? (
                  'Carregando...'
                ) : displayValue ? (
                  <span className="font-medium text-foreground">{displayValue}</span>
                ) : (
                  <span className="text-muted-foreground/60">{placeholder}</span>
                )}
              </span>
            </div>
            <ChevronDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-3"
          align="center"
          sideOffset={6}
          style={{ width: 'var(--radix-popover-trigger-width)' }}
        >
          <Command shouldFilter={false} value="">
            <CommandInput
              placeholder="Buscar cliente..."
              value={search}
              onValueChange={setSearch}
              className="h-12 text-base"
            />
            <CommandList className="max-h-[300px] mt-2">
              {filteredClients.length === 0 && (
                <CommandEmpty>
                  <div className="flex flex-col items-center py-6 text-muted-foreground">
                    <Package className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">Nenhum registro encontrado</p>
                  </div>
                </CommandEmpty>
              )}

              {filteredClients.length > 0 && (
                <CommandGroup className="p-0">
                  {filteredClients.map((client) => (
                    <CommandItem
                      key={client.id}
                      value={client.id}
                      onSelect={() => handleSelect(client)}
                      className={cn(
                        'py-2.5 px-3 rounded-lg',
                        value === client.id && 'bg-accent/50 data-[selected=true]:bg-accent'
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f59e0b]/15 text-[11px] font-semibold text-[#f59e0b] mr-2.5">
                        {getInitials(client.name)}
                      </span>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate font-medium">{client.name}</span>
                      </div>
                      <button
                        type="button"
                        className="ml-2 shrink-0 p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDialogOpen(client)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
            <div className="border-t p-2">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={handleAddNew}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar novo cliente
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSuccess}
        client={dialogEditingClient}
      />
    </>
  )
}
