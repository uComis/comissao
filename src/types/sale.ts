export type Sale = {
  id: string
  organization_id: string
  seller_id: string
  external_id: string | null
  client_name: string
  gross_value: number
  net_value: number
  sale_date: string
  created_at: string
  updated_at: string
}

export type CreateSaleInput = {
  organization_id: string
  seller_id: string
  external_id?: string
  client_name: string
  gross_value: number
  net_value: number
  sale_date: string
}

export type UpdateSaleInput = Partial<
  Omit<Sale, 'id' | 'organization_id' | 'created_at' | 'updated_at'>
>

// Sale com dados do vendedor
export type SaleWithSeller = Sale & {
  seller: {
    id: string
    name: string
  }
}

