export type Product = {
  id: string
  organization_id: string | null
  user_id: string | null
  personal_supplier_id: string | null
  name: string
  sku: string | null
  unit_price: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CreateProductInput = {
  name: string
  sku?: string
  unit_price?: number
}

export type UpdateProductInput = Partial<Omit<Product, 'id' | 'organization_id' | 'user_id' | 'created_at' | 'updated_at'>>
