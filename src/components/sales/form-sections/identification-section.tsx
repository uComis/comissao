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
      <div className="space-y-3 mt-2">
        {/* Pasta */}
        <div className="relative group">
          <SupplierPicker
            suppliers={suppliers}
            value={supplierId}
            onChange={onSupplierChange}
            onSupplierCreated={onSupplierCreated}
            onAddClick={() => setAddDialogOpen(true)}
            className="w-full border-2 border-primary/10 hover:border-primary/30 transition-all rounded-xl"
          />
          <div className={cn(
            "mt-1 flex items-center justify-end gap-1.5 transition-all duration-300",
            supplierId ? "opacity-100 h-6" : "opacity-0 h-0 pointer-events-none"
          )}>
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

        {/* Cliente */}
        <div className="mt-3">
          <ClientPicker
            value={clientId}
            onChange={onClientChange}
            onAddClick={() => onClientAddClick()}
            refreshTrigger={clientRefreshTrigger}
            className="w-full border-2 border-primary/10 hover:border-primary/30 transition-all rounded-xl"
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
