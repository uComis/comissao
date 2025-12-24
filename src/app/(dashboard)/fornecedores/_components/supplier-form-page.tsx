'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RuleForm, type RuleFormRef } from '@/components/rules'
import { ProductTable, ProductDialog } from '@/components/products'
import { createPersonalSupplierWithRule, updatePersonalSupplierWithRule } from '@/app/actions/personal-suppliers'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Plus, Package } from 'lucide-react'
import Link from 'next/link'
import type { PersonalSupplier } from '@/app/actions/personal-suppliers'
import type { CommissionRule, Product } from '@/types'

type Props = {
  supplier?: PersonalSupplier & { commission_rule?: CommissionRule | null }
  products?: Product[]
}

export function SupplierFormPage({ supplier, products = [] }: Props) {
  const router = useRouter()
  const ruleFormRef = useRef<RuleFormRef>(null)
  
  const [name, setName] = useState(supplier?.name || '')
  const [cnpj, setCnpj] = useState(formatCnpj(supplier?.cnpj || ''))
  const [loading, setLoading] = useState(false)
  const [productDialogOpen, setProductDialogOpen] = useState(false)

  const isEditing = !!supplier

  function formatCnpj(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
  }

  function handleCnpjChange(value: string) {
    setCnpj(formatCnpj(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    if (!ruleFormRef.current?.validate()) {
      toast.error('Configure a regra de comissão')
      return
    }

    setLoading(true)

    try {
      const ruleData = ruleFormRef.current.getData()
      const cleanCnpj = cnpj.replace(/\D/g, '') || undefined

      if (isEditing && supplier) {
        const result = await updatePersonalSupplierWithRule(supplier.id, {
          name,
          cnpj: cleanCnpj,
          rule: {
            name: ruleData.name || `${name} - Regra`,
            type: ruleData.type,
            percentage: ruleData.percentage,
            tiers: ruleData.tiers,
          },
        })

        if (result.success) {
          toast.success('Fornecedor atualizado')
          router.push('/fornecedores')
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createPersonalSupplierWithRule({
          name,
          cnpj: cleanCnpj,
          rule: {
            name: ruleData.name || `${name} - Regra`,
            type: ruleData.type,
            percentage: ruleData.percentage,
            tiers: ruleData.tiers,
          },
        })

        if (result.success) {
          toast.success('Fornecedor criado')
          router.push('/fornecedores')
        } else {
          toast.error(result.error)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/fornecedores">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? 'Editar Pasta' : 'Nova Pasta'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Atualize os dados do fornecedor' : 'Cadastre uma nova empresa/fábrica que você representa'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grid 2 colunas no desktop */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Fornecedor</CardTitle>
              <CardDescription>
                Informações da empresa/fábrica que você representa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa/Fábrica *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Tintas Coral"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={cnpj}
                  onChange={(e) => handleCnpjChange(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
                <p className="text-muted-foreground text-xs">
                  Opcional. Permite vincular automaticamente quando a empresa entrar no sistema.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regra de Comissão</CardTitle>
              <CardDescription>
                Configure como sua comissão é calculada para este fornecedor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RuleForm
                ref={ruleFormRef}
                rule={supplier?.commission_rule}
                showName={false}
                showDefault={false}
              />
            </CardContent>
          </Card>
        </div>

        {/* Seção de produtos - apenas na edição */}
        {isEditing && supplier && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Produtos</CardTitle>
                  <CardDescription>
                    Produtos que você vende desta empresa/fábrica
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setProductDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <ProductTable
                  products={products}
                  supplierId={supplier.id}
                  showSku={false}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="mb-4 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum produto cadastrado. Clique em "Adicionar" para começar.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild disabled={loading}>
            <Link href="/fornecedores">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Salvar' : 'Criar Fornecedor'}
          </Button>
        </div>
      </form>

      {/* Dialog de novo produto - fora do form para evitar conflito de submit */}
      {isEditing && supplier && (
        <ProductDialog
          open={productDialogOpen}
          onOpenChange={setProductDialogOpen}
          supplierId={supplier.id}
          showSku={false}
        />
      )}
    </div>
  )
}
