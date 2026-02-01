'use client'

import { useHeaderActions } from '@/components/layout'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function MinhasVendasActions() {
  useHeaderActions(
    <Button asChild className="hidden md:inline-flex">
      <Link href="/minhasvendas/nova">
        <Plus className="h-4 w-4 mr-2" />
        <span>Nova Venda</span>
      </Link>
    </Button>
  )
  return null
}
