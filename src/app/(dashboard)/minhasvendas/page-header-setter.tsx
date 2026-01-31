'use client'

import { useHeaderActions } from '@/components/layout'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function MinhasVendasActions() {
  useHeaderActions(
    <Button asChild>
      <Link href="/minhasvendas/nova">
        <Plus className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">Nova Venda</span>
      </Link>
    </Button>
  )
  return null
}
