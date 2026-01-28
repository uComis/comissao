import { Briefcase, UserRound } from 'lucide-react'
import { ClientPicker } from '@/components/clients'
import { SupplierPicker } from '@/components/suppliers'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

type IdentificationSectionProps = {
  suppliers: PersonalSupplierWithRules[]
  supplierId: string
  clientId: string | null
  clientRefreshTrigger: number
  showClient: boolean
  onSupplierChange: (id: string) => void
  onClientChange: (id: string | null, name: string) => void
  onSupplierAddClick: (name?: string) => void
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
  onSupplierAddClick,
  onClientAddClick,
}: IdentificationSectionProps) {
  return (
    <div className="space-y-4">
      {/* Card Pasta */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between px-5 pt-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pasta</p>
            <p className="text-[11px] text-muted-foreground/70">Fornecedor / representada</p>
          </div>
          <Briefcase className="h-4 w-4 text-[#409eff]/50" />
        </div>
        <div className="px-5 pt-2 pb-4">
          <SupplierPicker
            suppliers={suppliers}
            value={supplierId}
            onChange={onSupplierChange}
            onAddClick={onSupplierAddClick}
            placeholder="Selecione a pasta"
            className="w-full"
          />
        </div>
      </div>

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
