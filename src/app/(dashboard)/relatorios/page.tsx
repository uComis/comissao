'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOrganization } from '@/contexts/organization-context'
import { getReportData } from '@/app/actions/commissions'
import { getActiveSellers } from '@/app/actions/sellers'
import { getSalesPeriods } from '@/app/actions/sales'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { Seller } from '@/types'

import { BillingCompositionChart } from '@/components/dashboard'
import { PageHeader } from '@/components/layout'

type ReportData = {
  gross: number
  deduction: number
  commission: number
  result: number
  salesCount: number
  deductionPercent: number
  commissionPercent: number
  resultPercent: number
}

export default function RelatoriosPage() {
  const { organization, loading: orgLoading } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [periods, setPeriods] = useState<{ value: string; label: string }[]>([])
  const [period, setPeriod] = useState<string>('')
  const [sellers, setSellers] = useState<Seller[]>([])
  const [sellerId, setSellerId] = useState<string>('__all__')
  const [commissionStatus, setCommissionStatus] = useState<'all' | 'open' | 'closed'>('all')
  const [data, setData] = useState<ReportData | null>(null)

  // Carrega períodos disponíveis
  useEffect(() => {
    async function loadPeriods() {
      if (!organization) return
      const data = await getSalesPeriods(organization.id)
      setPeriods(data)
      if (data.length > 0 && !period) {
        setPeriod(data[0].value)
      }
    }
    loadPeriods()
  }, [organization, period])

  // Carrega vendedores
  useEffect(() => {
    async function loadSellers() {
      if (!organization) return
      const data = await getActiveSellers(organization.id)
      setSellers(data)
    }
    loadSellers()
  }, [organization])

  // Carrega dados do relatório
  const loadData = useCallback(async () => {
    if (!organization || !period) return
    setLoading(true)
    try {
      const result = await getReportData(
        organization.id,
        period,
        sellerId === '__all__' ? null : sellerId,
        commissionStatus
      )
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [organization, period, sellerId, commissionStatus])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (orgLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Organização não encontrada
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Relatórios" 
        description="Visão consolidada para fechamento" 
      />

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Select value={sellerId} onValueChange={setSellerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os vendedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os vendedores</SelectItem>
                  {sellers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status Comissão</Label>
              <Select value={commissionStatus} onValueChange={(v) => setCommissionStatus(v as 'all' | 'open' | 'closed')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="open">Abertas</SelectItem>
                  <SelectItem value="closed">Fechadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <BillingCompositionChart data={data || undefined} loading={loading} />
      </div>
    </div>
  )
}

