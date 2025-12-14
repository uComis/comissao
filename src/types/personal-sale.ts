export type PersonalSaleItem = {
  id: string
  personal_sale_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export type PersonalSale = {
  id: string
  user_id: string
  supplier_id: string | null
  client_id: string | null
  client_name: string | null
  gross_value: number | null
  net_value: number | null
  commission_value: number | null
  commission_rate: number | null
  sale_date: string | null
  payment_condition: string | null
  source: 'manual' | 'ocr' | 'api'
  notes: string | null
  created_at: string
  updated_at: string
  supplier?: {
    id: string
    name: string
  }
  client?: {
    id: string
    name: string
  }
  items?: PersonalSaleItem[]
}

export type PersonalSaleWithItems = PersonalSale & {
  items: PersonalSaleItem[]
}

export type CreatePersonalSaleItemInput = {
  product_id?: string | null
  product_name: string
  quantity: number
  unit_price: number
}

export type CreatePersonalSaleInput = {
  supplier_id: string
  client_id: string
  client_name: string
  sale_date: string
  payment_condition?: string
  notes?: string
  items: CreatePersonalSaleItemInput[]
}

