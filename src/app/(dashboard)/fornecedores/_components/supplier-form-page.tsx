'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RuleForm, type RuleFormRef } from '@/components/rules'
import { ProductTable, ProductDialog } from '@/components/products'
import { createPersonalSupplierWithRule, updatePersonalSupplierWithRules } from '@/app/actions/personal-suppliers'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Plus, Package, Trash2, Edit2, Star } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout'
import type { PersonalSupplier } from '@/app/actions/personal-suppliers'
import type { Product, CommissionRule } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge'

type Props = {
  supplier?: PersonalSupplier & { 
    commission_rules?: CommissionRule[] 
    commission_rule?: CommissionRule | null // Compatibilidade com tipo antigo
  }
  products?: Product[]
}

export function SupplierFormPage({ supplier, products = [] }: Props) {
  const router = useRouter()
  const ruleFormRef = useRef<RuleFormRef>(null)
  
  // Dados do fornecedor
  const [name, setName] = useState(supplier?.name || '')
  const [cnpj, setCnpj] = useState(formatCnpj(supplier?.cnpj || ''))
  const [defaultCommission, setDefaultCommission] = useState<string | number>(supplier?.default_commission_rate ?? 0)
  const [defaultTax, setDefaultTax] = useState<string | number>(supplier?.default_tax_rate ?? 0)
  
  // Regras
  const existingRules = supplier?.commission_rules || (supplier?.commission_rule ? [supplier.commission_rule] : [])
  const [rules, setRules] = useState<CommissionRule[]>(existingRules)
  const [defaultRuleId, setDefaultRuleId] = useState<string | null>(supplier?.commission_rule_id || (existingRules[0]?.id) || null)

  // Estados de controle
  const [loading, setLoading] = useState(false)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)

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

  // --- Gestão de Regras ---

  function handleAddRule() {
    setEditingRuleId(null)
    setRuleDialogOpen(true)
    // Pequeno delay para garantir que o ref esteja montado/resetado
    setTimeout(() => ruleFormRef.current?.reset(), 0)
  }

  function handleEditRule(rule: CommissionRule) {
    setEditingRuleId(rule.id)
    setRuleDialogOpen(true)
  }

  function handleSaveRule(e: React.FormEvent) {
    e.preventDefault()
    if (!ruleFormRef.current?.validate()) return

    const formData = ruleFormRef.current.getData()
    
    if (editingRuleId) {
      // Editar existente
      setRules(prev => prev.map(r => r.id === editingRuleId ? {
        ...r,
        name: formData.name,
        type: formData.type,
        percentage: formData.percentage,
        tiers: formData.tiers
      } : r))
    } else {
      // Adicionar nova (ID temporário se não persistido)
      const newRule: CommissionRule = {
        id: crypto.randomUUID(), // ID temporário
        personal_supplier_id: supplier?.id || '',
        organization_id: null,
        name: formData.name,
        type: formData.type,
        target: formData.target || 'commission',
        percentage: formData.percentage,
        tiers: formData.tiers,
        is_default: rules.length === 0, // Primeira regra vira default
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setRules(prev => [...prev, newRule])
      if (rules.length === 0) setDefaultRuleId(newRule.id)
    }
    
    setRuleDialogOpen(false)
  }

  function handleDeleteRule(ruleId: string) {
    setRules(prev => prev.filter(r => r.id !== ruleId))
    if (defaultRuleId === ruleId) {
      setDefaultRuleId(null) // Usuario terá que escolher outra
    }
  }

  // --- Submit Principal ---

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    if (rules.length === 0) {
      toast.error('Adicione pelo menos uma regra de comissão')
      return
    }

    if (!defaultRuleId && rules.length > 0) {
       toast.error('Selecione uma regra padrão')
       return
    }

    // Se estiver criando novo, usa a lógica antiga (uma regra inicial)
    // Se estiver editando, usa a nova lógica (multiplas regras)
    // TODO: Unificar create para suportar N regras de cara se necessário, 
    // mas por enquanto mantemos create simples e update robusto.

    setLoading(true)

    try {
      const cleanCnpj = cnpj.replace(/\D/g, '') || undefined

      if (isEditing && supplier) {
        const result = await updatePersonalSupplierWithRules(supplier.id, {
          name,
          cnpj: cleanCnpj,
          default_rule_id: defaultRuleId!,
          default_commission_rate: Number(defaultCommission) || 0,
          default_tax_rate: Number(defaultTax) || 0,
          rules: rules.map(r => ({
            id: existingRules.find(ex => ex.id === r.id) ? r.id : undefined,
            name: r.name,
            type: r.type,
            target: r.target || 'commission',
            percentage: r.percentage,
            tiers: r.tiers,
            is_default: r.id === defaultRuleId
          }))
        })

        if (result.success) {
          toast.success('Fornecedor atualizado')
          router.push('/fornecedores')
          router.refresh()
        } else {
          toast.error(result.error)
        }
      } else {
        // Create - Modo Simplificado (apenas a primeira regra, que será default)
        // O usuário pode adicionar mais regras depois de criar.
        // Ou adaptamos o create para aceitar array. Mantendo simples por enquanto.
        const mainRule = rules.find(r => r.id === defaultRuleId) || rules[0]
        
        const result = await createPersonalSupplierWithRule({
          name,
          cnpj: cleanCnpj,
          rule: {
            name: mainRule.name,
            type: mainRule.type,
            target: mainRule.target || 'commission',
            percentage: mainRule.percentage,
            tiers: mainRule.tiers,
          },
          default_commission_rate: Number(defaultCommission) || 0,
          default_tax_rate: Number(defaultTax) || 0,
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/fornecedores">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader 
          title={isEditing ? 'Editar Pasta' : 'Nova Pasta'}
          description={isEditing ? 'Atualize os dados do fornecedor' : 'Cadastre uma nova empresa/fábrica que você representa'}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grid 2 colunas no desktop */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Coluna 1: Dados Básicos */}
          <div className="space-y-6">
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
                </div>

              </CardContent>
            </Card>

            {/* Lista de Regras */}
            <Card>
              <CardHeader>
                <CardTitle>Regras de Comissão</CardTitle>
                <CardDescription>
                  Gerencie as diferentes regras para este fornecedor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                  <div className="space-y-2">
                    <Label htmlFor="defaultCommission">Comissão Padrão (%)</Label>
                    <Input
                      id="defaultCommission"
                      type="number"
                      step="0.01"
                      value={defaultCommission}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val !== '' && parseFloat(val) < 0) {
                          setDefaultCommission('')
                        } else {
                          setDefaultCommission(val)
                        }
                      }}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultTax">Taxa Padrão (%)</Label>
                    <Input
                      id="defaultTax"
                      type="number"
                      step="0.01"
                      value={defaultTax}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val !== '' && parseFloat(val) < 0) {
                          setDefaultTax('')
                        } else {
                          setDefaultTax(val)
                        }
                      }}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Regras por Faixa</h4>
                    {rules.length > 0 && (
                      <Button type="button" size="icon" variant="ghost" onClick={handleAddRule} className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {rules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed rounded-lg space-y-4">
                      <p className="text-muted-foreground text-sm">
                        Nenhuma regra cadastrada. Adicione ao menos uma.
                      </p>
                      <Button type="button" size="sm" onClick={handleAddRule} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Regra
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rules.map((rule) => (
                        <div 
                          key={rule.id} 
                          className={`flex items-center justify-between p-3 border rounded-lg ${defaultRuleId === rule.id ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{rule.name}</span>
                              {defaultRuleId === rule.id && (
                                <Badge variant="secondary" className="text-xs h-5">Padrão</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {rule.type === 'fixed' 
                                ? `${rule.percentage}% fixo` 
                                : `${rule.tiers?.length || 0} faixas escalonadas`
                              }
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {defaultRuleId !== rule.id && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                title="Definir como padrão"
                                onClick={() => setDefaultRuleId(rule.id)}
                              >
                                <Star className="h-4 w-4 text-muted-foreground hover:text-yellow-500" />
                              </Button>
                            )}
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditRule(rule)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteRule(rule.id)}
                              disabled={rules.length === 1} // Não pode apagar a última
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: Produtos (apenas edição) */}
          <div className="space-y-6">
            {isEditing && supplier && (
              <Card className="h-full flex flex-col">
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
                <CardContent className="flex-1">
                  {products.length > 0 ? (
                    <ProductTable
                      products={products}
                      supplierId={supplier.id}
                      showSku={false}
                      availableRules={rules}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                      <Package className="mb-4 h-10 w-10 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum produto cadastrado. Clique em &quot;Adicionar&quot; para começar.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Placeholder para create mode - explicar fluxo */}
            {!isEditing && (
                 <Card className="bg-muted/30 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Package className="mb-4 h-10 w-10 text-muted-foreground/50" />
                        <h3 className="font-medium">Cadastro de Produtos</h3>
                        <p className="text-sm text-muted-foreground mt-2 px-8">
                            Após salvar o fornecedor e sua regra de comissão, você poderá cadastrar os produtos.
                        </p>
                    </CardContent>
                 </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" asChild disabled={loading}>
            <Link href="/fornecedores">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Fornecedor'}
          </Button>
        </div>
      </form>

      {/* Dialog de Nova/Editar Regra */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingRuleId ? 'Editar Regra' : 'Nova Regra'}</DialogTitle>
                <DialogDescription>Defina as condições desta regra de comissão.</DialogDescription>
            </DialogHeader>
            
            <form id="rule-form-modal" onSubmit={handleSaveRule}>
                <RuleForm 
                    ref={ruleFormRef}
                    rule={editingRuleId ? rules.find(r => r.id === editingRuleId) : null}
                    showName={true}
                    showDefault={false} // Default é gerenciado na lista
                    compact={true}
                />
            </form>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRuleDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" form="rule-form-modal">Salvar Regra</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de novo produto */}
      {isEditing && supplier && (
        <ProductDialog
          open={productDialogOpen}
          onOpenChange={setProductDialogOpen}
          supplierId={supplier.id}
          showSku={false}
          availableRules={rules}
          onAddRule={handleAddRule}
        />
      )}
    </div>
  )
}
