'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RuleForm, type RuleFormRef, type RuleFormData } from '@/components/rules'
import { ProductTable, ProductDialog } from '@/components/products'
import { DashedActionButton } from '@/components/ui/dashed-action-button'
import { CompactNumberInput } from '@/components/ui/compact-number-input'
import { createPersonalSupplierWithRule, updatePersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import { toast } from 'sonner'
import { Loader2, Plus, Package, Pencil } from 'lucide-react'
import Link from 'next/link'
import { useSetPageHeader } from '@/components/layout'
import type { PersonalSupplier } from '@/app/actions/personal-suppliers'
import type { Product, CommissionRule, CommissionTier } from '@/types'
import { cn } from '@/lib/utils'

type Props = {
  supplier?: PersonalSupplier & {
    commission_rules?: CommissionRule[]
    commission_rule?: CommissionRule | null
  }
  products?: Product[]
}

export function SupplierFormPage({ supplier, products: initialProducts = [] }: Props) {
  const router = useRouter()
  const ruleFormRef = useRef<RuleFormRef>(null)

  // Determinar regra padrão existente
  const existingDefaultRule = supplier?.commission_rules?.find(r => r.is_default) || supplier?.commission_rule

  // Dados do fornecedor
  const [name, setName] = useState(supplier?.name || '')
  const [cnpj, setCnpj] = useState(formatCnpj(supplier?.cnpj || ''))

  // Tipo de regra padrão: 'fixed' ou 'tiered'
  const [ruleType, setRuleType] = useState<'fixed' | 'tiered'>(existingDefaultRule?.type || 'fixed')

  // Valores para regra fixa
  const [defaultCommission, setDefaultCommission] = useState<number>(
    existingDefaultRule?.type === 'fixed'
      ? (existingDefaultRule.commission_percentage ?? supplier?.default_commission_rate ?? 0)
      : (supplier?.default_commission_rate ?? 0)
  )
  const [defaultTax, setDefaultTax] = useState<number>(
    existingDefaultRule?.type === 'fixed'
      ? (existingDefaultRule.tax_percentage ?? supplier?.default_tax_rate ?? 0)
      : (supplier?.default_tax_rate ?? 0)
  )

  // Faixas para regra por faixa
  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[]>(
    existingDefaultRule?.commission_tiers || [{ min: 0, max: null, percentage: 0 }]
  )

  // Produtos (estado local para atualização imediata)
  const [products, setProducts] = useState<Product[]>(initialProducts)

  // Estados de controle
  const [loading, setLoading] = useState(false)
  const [productDialogOpen, setProductDialogOpen] = useState(false)

  // Verificar se já tem comissão configurada
  const hasExistingCommission = !!(
    existingDefaultRule ||
    (supplier?.default_commission_rate && supplier.default_commission_rate > 0) ||
    (supplier?.default_tax_rate && supplier.default_tax_rate > 0)
  )

  // Seção de comissão: expandida se já existe, oculta para novas pastas
  const [showCommissionSection, setShowCommissionSection] = useState(hasExistingCommission)

  const isEditing = !!supplier

  // Edição inline dos dados do fornecedor (apenas no modo edição)
  const [isEditingSupplierData, setIsEditingSupplierData] = useState(!isEditing)
  const [originalName] = useState(supplier?.name || '')
  const [originalCnpj] = useState(formatCnpj(supplier?.cnpj || ''))

  function handleCancelSupplierEdit() {
    setName(originalName)
    setCnpj(originalCnpj)
    setIsEditingSupplierData(false)
  }

  async function handleSaveSupplierData() {
    if (!name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    if (!supplier) return

    setLoading(true)
    try {
      const cleanCnpj = cnpj.replace(/\D/g, '') || undefined

      // Montar regra padrão
      const defaultRule = {
        id: existingDefaultRule?.id,
        name: 'Regra Padrão',
        type: ruleType,
        commission_percentage: ruleType === 'fixed' ? defaultCommission : null,
        tax_percentage: ruleType === 'fixed' ? defaultTax : null,
        commission_tiers: ruleType === 'tiered' ? commissionTiers : null,
        is_default: true,
      }

      const result = await updatePersonalSupplierWithRules(supplier.id, {
        name,
        cnpj: cleanCnpj,
        default_rule_id: existingDefaultRule?.id || undefined,
        default_commission_rate: ruleType === 'fixed' ? defaultCommission : 0,
        default_tax_rate: ruleType === 'fixed' ? defaultTax : 0,
        rules: [defaultRule],
      })

      if (result.success) {
        toast.success('Dados atualizados')
        setIsEditingSupplierData(false)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  // Funções para gerenciar faixas
  function addTier() {
    const lastTier = commissionTiers[commissionTiers.length - 1]
    const newMin = lastTier.max ?? 0
    setCommissionTiers([
      ...commissionTiers.slice(0, -1),
      { ...lastTier, max: newMin },
      { min: newMin, max: null, percentage: 0 },
    ])
  }

  function removeTier(index: number) {
    if (commissionTiers.length <= 1) return
    const newTiers = commissionTiers.filter((_, i) => i !== index)
    if (newTiers.length > 0) {
      newTiers[newTiers.length - 1].max = null
    }
    setCommissionTiers(newTiers)
  }

  function updateTier(index: number, field: keyof CommissionTier, value: number | null) {
    const newTiers = [...commissionTiers]
    newTiers[index] = { ...newTiers[index], [field]: value }
    setCommissionTiers(newTiers)
  }

  useSetPageHeader({
    title: isEditing ? 'Editar Pasta' : 'Nova Pasta',
    backHref: '/fornecedores',
  })

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

  // --- Gestão de Produtos ---

  function handleProductCreated(product: Product) {
    setProducts(prev => [...prev, product])
  }

  function handleProductUpdated(product: Product) {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p))
  }

  function handleProductDeleted(productId: string) {
    setProducts(prev => prev.filter(p => p.id !== productId))
  }

  // --- Submit Principal ---

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    // Validar faixas se for regra por faixa
    if (ruleType === 'tiered' && commissionTiers.length === 0) {
      toast.error('Adicione pelo menos uma faixa de comissão')
      return
    }

    setLoading(true)

    try {
      const cleanCnpj = cnpj.replace(/\D/g, '') || undefined

      // Montar regra padrão
      const defaultRule = {
        id: existingDefaultRule?.id,
        name: 'Regra Padrão',
        type: ruleType,
        commission_percentage: ruleType === 'fixed' ? defaultCommission : null,
        tax_percentage: ruleType === 'fixed' ? defaultTax : null,
        commission_tiers: ruleType === 'tiered' ? commissionTiers : null,
        is_default: true,
      }

      if (isEditing && supplier) {
        const result = await updatePersonalSupplierWithRules(supplier.id, {
          name,
          cnpj: cleanCnpj,
          default_rule_id: existingDefaultRule?.id || undefined,
          default_commission_rate: ruleType === 'fixed' ? defaultCommission : 0,
          default_tax_rate: ruleType === 'fixed' ? defaultTax : 0,
          rules: [defaultRule],
        })

        if (result.success) {
          toast.success('Fornecedor atualizado')
          router.push('/fornecedores')
          router.refresh()
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createPersonalSupplierWithRule({
          name,
          cnpj: cleanCnpj,
          rule: {
            name: 'Regra Padrão',
            type: ruleType,
            commission_percentage: ruleType === 'fixed' ? defaultCommission : null,
            tax_percentage: ruleType === 'fixed' ? defaultTax : null,
            commission_tiers: ruleType === 'tiered' ? commissionTiers : null,
          },
          default_commission_rate: ruleType === 'fixed' ? defaultCommission : 0,
          default_tax_rate: ruleType === 'fixed' ? defaultTax : 0,
        })

        if (result.success) {
          toast.success('Fornecedor criado')
          router.push('/fornecedores')
          router.refresh()
        } else {
          toast.error(result.error)
        }
      }
    } catch (error) {
      toast.error('Erro inesperado ao salvar')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grid 2 colunas no desktop */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Coluna 1: Dados Básicos + Regra Padrão */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Dados do Fornecedor</CardTitle>
                    <CardDescription>
                      Informações da empresa/fábrica que você representa
                    </CardDescription>
                  </div>
                  {isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditingSupplierData(true)}
                      className={`h-8 w-8 transition-all duration-200 ${isEditingSupplierData ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dados básicos */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Empresa/Fábrica {isEditingSupplierData && '*'}</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Tintas Coral"
                      required
                      disabled={!isEditingSupplierData}
                      className={!isEditingSupplierData ? 'bg-muted/50 cursor-default' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={cnpj}
                      onChange={(e) => handleCnpjChange(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      disabled={!isEditingSupplierData}
                      className={!isEditingSupplierData ? 'bg-muted/50 cursor-default' : ''}
                    />
                  </div>
                </div>

                {/* Comissão Padrão */}
                {!showCommissionSection ? (
                  <DashedActionButton
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => setShowCommissionSection(true)}
                  >
                    Comissão padrão
                  </DashedActionButton>
                ) : (
                  <>
                    <div className="border-t" />
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">Comissão Padrão</Label>
                        <p className="text-sm text-muted-foreground">
                          Aplicada a todos os produtos, exceto os que têm override
                        </p>
                      </div>

                      {/* Toggle tipo de regra */}
                      <div className="grid grid-cols-2 gap-1 p-1 bg-muted/50 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setRuleType('fixed')}
                          className={cn(
                            'py-2.5 text-sm font-medium rounded-md transition-all',
                            ruleType === 'fixed'
                              ? 'bg-background shadow-sm text-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          Percentual Fixo
                        </button>
                        <button
                          type="button"
                          onClick={() => setRuleType('tiered')}
                          className={cn(
                            'py-2.5 text-sm font-medium rounded-md transition-all',
                            ruleType === 'tiered'
                              ? 'bg-background shadow-sm text-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          Por Faixa de Valor
                        </button>
                      </div>

                      {/* Campos para percentual fixo */}
                      {ruleType === 'fixed' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Comissão (%)</Label>
                            <CompactNumberInput
                              value={defaultCommission}
                              onChange={setDefaultCommission}
                              min={0}
                              max={100}
                              step={0.5}
                              decimals={2}
                              suffix="%"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Taxa/Imposto (%)</Label>
                            <CompactNumberInput
                              value={defaultTax}
                              onChange={setDefaultTax}
                              min={0}
                              max={100}
                              step={0.5}
                              decimals={2}
                              suffix="%"
                            />
                          </div>
                        </div>
                      )}

                  {/* Campos para faixas */}
                  {ruleType === 'tiered' && (
                    <div className="space-y-3">
                      {commissionTiers.map((tier, index) => (
                        <div key={index} className="p-3 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                              Faixa {index + 1}
                            </span>
                            {commissionTiers.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-destructive hover:text-destructive"
                                onClick={() => removeTier(index)}
                              >
                                Remover
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Mínimo (R$)</Label>
                              <Input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="0.01"
                                value={tier.min}
                                onChange={(e) => updateTier(index, 'min', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">
                                {index === commissionTiers.length - 1 ? 'Máximo' : 'Máximo (R$)'}
                              </Label>
                              <Input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="0.01"
                                value={tier.max ?? ''}
                                onChange={(e) =>
                                  updateTier(index, 'max', e.target.value ? parseFloat(e.target.value) : null)
                                }
                                disabled={index === commissionTiers.length - 1}
                                placeholder={index === commissionTiers.length - 1 ? '∞' : ''}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Comissão (%)</Label>
                              <Input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                max="100"
                                step="0.01"
                                value={tier.percentage}
                                onChange={(e) => updateTier(index, 'percentage', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <DashedActionButton
                        icon={<Plus className="h-4 w-4" />}
                        onClick={addTier}
                      >
                        Adicionar faixa
                      </DashedActionButton>

                      <p className="text-xs text-muted-foreground">
                        A última faixa sempre terá valor máximo ilimitado
                      </p>
                    </div>
                  )}
                </div>
                  </>
                )}

                {/* Botões de ação inline (modo edição) */}
                <div
                  className={`flex justify-end gap-2 pt-2 overflow-hidden transition-all duration-200 ease-out ${
                    isEditingSupplierData && isEditing
                      ? 'max-h-12 opacity-100'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelSupplierEdit}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveSupplierData}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: Produtos */}
          <div className="space-y-6">
            {isEditing && supplier && (
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Produtos</CardTitle>
                  <CardDescription>
                    Produtos que você vende desta empresa/fábrica
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  {products.length > 0 && (
                    <ProductTable
                      products={products}
                      supplierId={supplier.id}
                      showSku={false}
                      supplierCommission={ruleType === 'fixed' ? defaultCommission : null}
                      supplierTax={ruleType === 'fixed' ? defaultTax : null}
                      onProductDeleted={handleProductDeleted}
                      onProductUpdated={handleProductUpdated}
                    />
                  )}
                  <DashedActionButton
                    icon={<Plus className="h-4 w-4" />}
                    prominent={products.length === 0}
                    onClick={() => setProductDialogOpen(true)}
                  >
                    {products.length === 0 ? 'Adicionar produto' : 'Adicionar outro produto'}
                  </DashedActionButton>
                </CardContent>
              </Card>
            )}

            {/* Placeholder para create mode */}
            {!isEditing && (
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="mb-4 h-10 w-10 text-muted-foreground/50" />
                  <h3 className="font-medium">Cadastro de Produtos</h3>
                  <p className="text-sm text-muted-foreground mt-2 px-8">
                    Após salvar o fornecedor, você poderá cadastrar os produtos.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Botões do rodapé apenas no modo criação */}
        {!isEditing && (
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" asChild disabled={loading}>
              <Link href="/fornecedores">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Fornecedor
            </Button>
          </div>
        )}
      </form>

      {/* Dialog de novo produto */}
      {isEditing && supplier && (
        <ProductDialog
          open={productDialogOpen}
          onOpenChange={setProductDialogOpen}
          supplierId={supplier.id}
          showSku={false}
          onProductCreated={handleProductCreated}
        />
      )}
    </div>
  )
}
