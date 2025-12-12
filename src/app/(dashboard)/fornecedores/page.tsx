'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Building2 } from 'lucide-react'

export default function FornecedoresPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Minhas Pastas</h1>
          <p className="text-muted-foreground">Empresas que você representa</p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="font-semibold">Nenhuma pasta cadastrada</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Adicione as empresas/fábricas que você representa para começar a auditar suas comissões.
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Pasta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

