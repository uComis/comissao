'use client'

import { useState } from 'react'
import { ClientPicker } from '@/components/clients'
import { SupplierPicker, SupplierDialog } from '@/components/suppliers'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Pasta */}
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground/70 ml-1">Pasta</Label>
          <SupplierPicker
            suppliers={suppliers}
            value={supplierId}
            onChange={onSupplierChange}
            onSupplierCreated={onSupplierCreated}
            onAddClick={() => setAddDialogOpen(true)}
            placeholder="Selecione a pasta"
            className="w-full"
          />
          <div className={cn(
            "grid transition-all duration-300 ease-in-out",
            supplierId ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}>
            <div className="overflow-hidden">
              <div className="flex items-center justify-end gap-1.5 pt-0.5">
                <Label htmlFor="default-supplier" className="text-[11px] text-muted-foreground/70 cursor-pointer">
                  Usar sempre esta pasta
                </Label>
                <Switch
                  id="default-supplier"
                  checked={isDefaultSupplier}
                  onCheckedChange={onDefaultSupplierChange}
                  className="scale-75"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cliente */}
        <div className={cn(
          "space-y-1 transition-all duration-300",
          showClient ? "opacity-100" : "opacity-30 pointer-events-none"
        )}>
          <Label className="text-[11px] text-muted-foreground/70 ml-1">Cliente</Label>
          <ClientPicker
            value={clientId}
            onChange={onClientChange}
            onAddClick={() => onClientAddClick()}
            placeholder="Selecionar cliente..."
            refreshTrigger={clientRefreshTrigger}
            className="w-full"
          />
        </div>
      </div>

      <SupplierDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleAddSuccess}
      />
    </>
  )
}
