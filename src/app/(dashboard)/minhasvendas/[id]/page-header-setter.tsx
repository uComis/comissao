'use client'

import { useSetPageHeader, useHeaderActions } from '@/components/layout'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'

export function SaleDetailHeader({ id, clientName, saleDate }: { id: string; clientName: string | null; saleDate: string }) {
  useSetPageHeader({ title: 'Detalhes da Venda', backHref: '/minhasvendas' })
  useHeaderActions(
    <Button asChild>
      <Link href={`/minhasvendas/${id}/editar`}>
        <Pencil className="h-4 w-4 mr-2" />
        Editar
      </Link>
    </Button>
  )
  return null
}
