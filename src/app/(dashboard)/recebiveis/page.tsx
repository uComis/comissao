'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export default function RecebiveisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recebíveis</h1>
        <p className="text-muted-foreground">Acompanhe seus pagamentos</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="font-semibold">Nenhum recebível</h3>
          <p className="text-sm text-muted-foreground">
            Cadastre vendas para ver a projeção de recebíveis.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

