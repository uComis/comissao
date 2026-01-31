'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSetPageHeader, useHeaderActions } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { PersonalSaleForm } from '@/components/sales'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import type { Product } from '@/types'

type Props = {
  suppliers: PersonalSupplierWithRules[]
  productsBySupplier: Record<string, Product[]>
}

export function NovaVendaShell({ suppliers, productsBySupplier }: Props) {
  const [saving, setSaving] = useState(false)

  useSetPageHeader({ title: 'Registro de venda', backHref: '/minhasvendas' })
  useHeaderActions(
    <>
      <Button variant="outline" asChild disabled={saving}>
        <Link href="/minhasvendas">Cancelar</Link>
      </Button>
      <Button type="submit" form="sale-form" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar Venda'}
      </Button>
    </>
  )

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mt-5 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-150">
        <PersonalSaleForm
          suppliers={suppliers}
          productsBySupplier={productsBySupplier}
          formId="sale-form"
          onSavingChange={setSaving}
        />
      </div>
    </div>
  )
}
