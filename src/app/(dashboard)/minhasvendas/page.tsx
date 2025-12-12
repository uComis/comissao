'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, ShoppingCart } from 'lucide-react'

export default function MinhasVendasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Minhas Vendas</h1>
          <p className="text-muted-foreground">Registro de pedidos faturados</p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nova Venda
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="font-semibold">Nenhuma venda cadastrada</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Registre suas vendas para acompanhar suas comissões e recebíveis.
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Registrar Venda
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

