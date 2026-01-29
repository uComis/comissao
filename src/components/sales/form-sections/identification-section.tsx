'use client'

import { useState } from 'react'
import { Plus, UserRound } from 'lucide-react'
import { ClientPicker } from '@/components/clients'
import { SupplierPicker, SupplierDialog } from '@/components/suppliers'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

type IdentificationSectionProps = {
  suppliers: PersonalSupplierWithRules[]
  supplierId: string
  clientId: string | null
  clientRefreshTrigger: number
  showClient: boolean
  onSupplierChange: (id: string) => void
  onClientChange: (id: string | null, name: string) => void
  onSupplierCreated: (supplier: PersonalSupplierWithRules) => void
  onClientAddClick: (name?: string) => void
}

export function IdentificationSection({
  suppliers,
  supplierId,
  clientId,
  clientRefreshTrigger,
  showClient,
  onSupplierChange,
  onClientChange,
  onSupplierCreated,
  onClientAddClick,
}: IdentificationSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  function handleAddSuccess(supplier: PersonalSupplierWithRules) {
    onSupplierCreated(supplier)
    onSupplierChange(supplier.id)
  }

  return (
    <div className="space-y-4">
      {/* Card Pasta */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between px-5 pt-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pasta</p>
            <p className="text-[11px] text-muted-foreground/70">Fornecedor / representada</p>
          </div>
          <button
            type="button"
            onClick={() => setAddDialogOpen(true)}
            className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 pt-2 pb-4">
          <SupplierPicker
            suppliers={suppliers}
            value={supplierId}
            onChange={onSupplierChange}
            onSupplierCreated={onSupplierCreated}
            onAddClick={() => setAddDialogOpen(true)}
            placeholder="Selecione a pasta"
            className="w-full"
          />
        </div>
      </div>

      <SupplierDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleAddSuccess}
      />

      {/* Card Cliente */}
      {showClient && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center justify-between px-5 pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cliente</p>
                <p className="text-[11px] text-muted-foreground/70">Para quem foi a venda</p>
              </div>
              <UserRound className="h-4 w-4 text-[#f59e0b]/50" />
            </div>
            <div className="px-5 pt-2 pb-4">
              <ClientPicker
                value={clientId}
                onChange={onClientChange}
                onAddClick={onClientAddClick}
                placeholder="Selecionar cliente..."
                refreshTrigger={clientRefreshTrigger}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
