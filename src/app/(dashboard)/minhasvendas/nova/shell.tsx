'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSetPageHeader, useHeaderActions } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { PersonalSaleForm } from '@/components/sales'
import { KaiFormCard } from '@/components/ai-assistant/kai-form-card'
import type { PersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import type { Product, PersonalClient } from '@/types'

type Props = {
  suppliers: PersonalSupplierWithRules[]
  productsBySupplier: Record<string, Product[]>
  clients?: PersonalClient[]
}

export function NovaVendaShell({ suppliers, productsBySupplier, clients }: Props) {
  const [saving, setSaving] = useState(false)

  useSetPageHeader({ title: 'Registro de venda', backHref: '/minhasvendas', taskMode: true, contentMaxWidth: 'max-w-4xl' })
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
      <KaiFormCard description="O Kai pode preencher o formulário por você!" />
      <div className="mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-150">
        <PersonalSaleForm
          suppliers={suppliers}
          productsBySupplier={productsBySupplier}
          initialClients={clients}
          formId="sale-form"
          onSavingChange={setSaving}
        />
      </div>
    </div>
  )
}
