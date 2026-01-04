'use client'

import * as React from 'react'
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

export type ComboboxOption = {
  value: string
  label: string
}

type Props = {
  options: ComboboxOption[]
  value: string
  onChange: (value: string, label: string) => void
  onAddClick?: (initialName?: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
}

export function ComboboxCreatable({
  options,
  value,
  onChange,
  onAddClick,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Pesquisar...',
  emptyMessage = 'Nenhum resultado.',
  className,
}: Props) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const selectedOption = options.find((opt) => opt.value === value)
  const displayValue = selectedOption?.label || value || ''

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  const showCreateOption =
    search.trim() !== '' &&
    !filteredOptions.some(
      (opt) => opt.label.toLowerCase() === search.toLowerCase()
    )

  function handleSelect(optionValue: string, optionLabel: string) {
    onChange(optionValue, optionLabel)
    setOpen(false)
    setSearch('')
  }

  function handleCreateNew() {
    onChange('', search.trim())
    setOpen(false)
    setSearch('')
  }

  function handleAddClick() {
    const initialName = search.trim() || undefined
    setOpen(false)
    setSearch('')
    onAddClick?.(initialName)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between font-normal', className)}
        >
          <span className="truncate">
            {displayValue || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[280px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
            className="h-12"
          />
          <CommandList className="max-h-[300px]">
            {filteredOptions.length === 0 && !showCreateOption && !onAddClick && (
              <CommandEmpty className="py-6">{emptyMessage}</CommandEmpty>
            )}
            <CommandGroup className="p-2">
              {/* Botão Cadastrar - sempre visível quando onAddClick está disponível */}
              {onAddClick && (
                <CommandItem
                  onSelect={handleAddClick}
                  className="py-3 px-3 rounded-md text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {search.trim() ? (
                    <span>Cadastrar &quot;{search}&quot;</span>
                  ) : (
                    <span className="font-medium">Novo Produto</span>
                  )}
                </CommandItem>
              )}
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value, option.label)}
                  className="py-3 px-3 rounded-md"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              {showCreateOption && (
                <CommandItem onSelect={handleCreateNew} className="py-3 px-3 rounded-md">
                  <span className="text-muted-foreground mr-2">Usar:</span>
                  <span className="font-medium">{search}</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

