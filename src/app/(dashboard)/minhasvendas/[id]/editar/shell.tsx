'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSetPageHeader, useHeaderActions } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { PersonalSaleForm } from '@/components/sales'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import type { Product } from '@/types'
import type { PersonalSaleWithItems } from '@/types/personal-sale'

type Props = {
  suppliers: PersonalSupplierWithRules[]
  productsBySupplier: Record<string, Product[]>
  sale: PersonalSaleWithItems
  backHref: string
}

export function EditarVendaShell({ suppliers, productsBySupplier, sale, backHref }: Props) {
  const [saving, setSaving] = useState(false)

  useSetPageHeader({ title: 'Editar Venda', backHref, taskMode: true })
  useHeaderActions(
    <>
      <Button variant="outline" asChild disabled={saving}>
        <Link href={backHref}>Cancelar</Link>
      </Button>
      <Button type="submit" form="sale-form" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </>
  )

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mt-5 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-150">
        <PersonalSaleForm
          suppliers={suppliers}
          productsBySupplier={productsBySupplier}
          sale={sale}
          mode="edit"
          formId="sale-form"
          onSavingChange={setSaving}
        />
      </div>
    </div>
  )
}
