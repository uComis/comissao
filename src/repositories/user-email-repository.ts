import { createClient } from '@/lib/supabase'

export type UserEmail = {
  id: string
  user_id: string
  email: string
  is_primary: boolean
  verified: boolean
  verified_at: string | null
  created_at: string
}

export async function getUserEmails(): Promise<UserEmail[]> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('user_emails')
    .select('*')
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function addUserEmail(email: string): Promise<UserEmail> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('user_emails')
    .insert({
      user_id: user.id,
      email: email.toLowerCase().trim(),
      is_primary: false,
      verified: false,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function setPrimaryEmail(emailId: string): Promise<void> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Remove primary from all emails
  await supabase
    .from('user_emails')
    .update({ is_primary: false })
    .eq('user_id', user.id)

  // Set new primary
  const { error } = await supabase
    .from('user_emails')
    .update({ is_primary: true })
    .eq('id', emailId)

  if (error) throw error
}

export async function verifyEmail(emailId: string): Promise<UserEmail> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('user_emails')
    .update({
      verified: true,
      verified_at: new Date().toISOString(),
    })
    .eq('id', emailId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteUserEmail(emailId: string): Promise<void> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  // Check if it's primary
  const { data: email } = await supabase
    .from('user_emails')
    .select('is_primary')
    .eq('id', emailId)
    .single()

  if (email?.is_primary) {
    throw new Error('Cannot delete primary email')
  }

  const { error } = await supabase
    .from('user_emails')
    .delete()
    .eq('id', emailId)

  if (error) throw error
}

export async function findUserByEmail(email: string): Promise<string | null> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('user_emails')
    .select('user_id')
    .eq('email', email.toLowerCase().trim())
    .eq('verified', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data?.user_id || null
}

