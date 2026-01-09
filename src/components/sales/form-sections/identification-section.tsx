import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ClientPicker } from '@/components/clients'
import { SupplierPicker } from '@/components/suppliers'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

type IdentificationSectionProps = {
  suppliers: PersonalSupplierWithRules[]
  supplierId: string
  clientId: string | null
  clientRefreshTrigger: number
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
  onSupplierChange,
  onClientChange,
  onSupplierAddClick,
  onClientAddClick,
}: IdentificationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identificação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mt-[10px] mb-[20px]">
          <Label
            htmlFor="supplier"
            className="text-foreground/70 text-[13px] font-bold mb-1 block px-1"
          >
            Fornecedor (pasta) *
          </Label>
          <SupplierPicker
            suppliers={suppliers}
            value={supplierId}
            onChange={onSupplierChange}
            onAddClick={onSupplierAddClick}
            placeholder="Selecione o fornecedor"
          />
        </div>

        <div className="space-y-2 mt-[40px] mb-[20px]">
          <Label className="text-foreground/70 text-[13px] font-bold mb-1 block px-1">
            Cliente *
          </Label>
          <ClientPicker
            value={clientId}
            onChange={onClientChange}
            onAddClick={onClientAddClick}
            placeholder="Selecionar cliente..."
            refreshTrigger={clientRefreshTrigger}
          />
        </div>
      </CardContent>
    </Card>
  )
}
