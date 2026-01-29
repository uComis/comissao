'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ClientPicker } from '@/components/clients'
import { SupplierPicker, SupplierDialog } from '@/components/suppliers'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

type IdentificationSectionProps = {
  suppliers: PersonalSupplierWithRules[]
  supplierId: string
  clientId: string | null
  clientRefreshTrigger: number
  showClient: boolean
  isDefaultSupplier: boolean
  onSupplierChange: (id: string) => void
  onClientChange: (id: string | null, name: string) => void
  onSupplierCreated: (supplier: PersonalSupplierWithRules) => void
  onClientAddClick: (name?: string) => void
  onDefaultSupplierChange: (checked: boolean) => void
}

export function IdentificationSection({
  suppliers,
  supplierId,
  clientId,
  clientRefreshTrigger,
  showClient,
  isDefaultSupplier,
  onSupplierChange,
  onClientChange,
  onSupplierCreated,
  onClientAddClick,
  onDefaultSupplierChange,
}: IdentificationSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  function handleAddSuccess(supplier: PersonalSupplierWithRules) {
    onSupplierCreated(supplier)
    onSupplierChange(supplier.id)
  }

  return (
    <div className="space-y-4">
      {/* Card Pasta */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Pasta</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Fornecedor</p>
          </div>
          <button
            type="button"
            onClick={() => setAddDialogOpen(true)}
            className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </CardHeader>
        <div className="px-5 pt-0 pb-4 space-y-3">
          <SupplierPicker
            suppliers={suppliers}
            value={supplierId}
            onChange={onSupplierChange}
            onSupplierCreated={onSupplierCreated}
            onAddClick={() => setAddDialogOpen(true)}
            placeholder="Selecione a pasta"
            className="w-full"
          />
          {supplierId && (
            <div className="flex items-center justify-end gap-1.5">
              <Label htmlFor="default-supplier" className="text-[11px] text-muted-foreground/70 cursor-pointer">
                Pasta padrão
              </Label>
              <Switch
                id="default-supplier"
                checked={isDefaultSupplier}
                onCheckedChange={onDefaultSupplierChange}
                className="scale-75"
              />
            </div>
          )}
        </div>
      </Card>

      <SupplierDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleAddSuccess}
      />

      {/* Card Cliente */}
      {showClient && (
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-400 delay-200 fill-mode-both">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Cliente</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Para quem foi a venda</p>
              </div>
              <button
                type="button"
                onClick={() => onClientAddClick()}
                className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </CardHeader>
            <div className="px-5 pt-0 pb-4">
              <ClientPicker
                value={clientId}
                onChange={onClientChange}
                onAddClick={() => onClientAddClick()}
                placeholder="Selecionar cliente..."
                refreshTrigger={clientRefreshTrigger}
                className="w-full"
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
