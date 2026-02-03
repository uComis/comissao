'use client'

import { useSetPageHeader } from '@/components/layout'

export function SaleDetailHeader({ id, clientName, saleDate }: { id: string; clientName: string | null; saleDate: string }) {
  useSetPageHeader({ title: 'Detalhes da Venda', backHref: '/minhasvendas', contentMaxWidth: 'max-w-2xl' })
  return null
}
