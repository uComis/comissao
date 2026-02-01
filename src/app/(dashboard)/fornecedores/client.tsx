'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Building2 } from 'lucide-react'
import { SupplierTable, SupplierDialog } from '@/components/suppliers'
import { Fab } from '@/components/ui/fab'
import { useHeaderActions } from '@/components/layout'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'

type Props = {
  initialSuppliers: PersonalSupplierWithRules[]
}

export function FornecedoresClient({ initialSuppliers }: Props) {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [dialogOpen, setDialogOpen] = useState(false)

  useHeaderActions(
    <Button size="sm" onClick={() => setDialogOpen(true)} className="hidden md:inline-flex">
      <Plus className="h-4 w-4 mr-2" />
      <span>Adicionar</span>
    </Button>
  )

  const hasSuppliers = suppliers.length > 0

  function handleSupplierCreated(newSupplier: PersonalSupplierWithRules) {
    setSuppliers(prev => [...prev, newSupplier])
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Fab onClick={() => setDialogOpen(true)} label="Nova Pasta" />
      {hasSuppliers ? (
        <SupplierTable suppliers={suppliers} onDelete={(id) => setSuppliers(prev => prev.filter(s => s.id !== id))} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="font-semibold">Nenhuma pasta cadastrada</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Adicione as empresas/fábricas que você representa para começar a auditar suas comissões.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Pasta
            </Button>
          </CardContent>
        </Card>
      )}

      <SupplierDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={handleSupplierCreated}
      />
    </div>
  )
}
