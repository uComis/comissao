export type User = {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  organization_id: string | null
  role: 'admin' | 'member'
  is_super_admin: boolean
  created_at: string
  updated_at: string
}

export type CreateUserInput = {
  email: string
  name?: string
  avatar_url?: string
  organization_id?: string
  role?: 'admin' | 'member'
  is_super_admin?: boolean
}

export type UpdateUserInput = Partial<Omit<User, 'id' | 'created_at' | 'updated_at' | 'is_super_admin'>>
