'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sessionSchema } from '@/lib/validations/schemas'

export async function createSession(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    campaign_id: formData.get('campaign_id') as string || null,
    session_date: formData.get('session_date') as string || null,
    notes: formData.get('notes') as string || null,
  }

  const result = sessionSchema.safeParse(data)
  if (!result.success) {
    throw new Error('Validation failed')
  }

  const { data: session, error } = await supabase
    .from('sessions')
    .insert(result.data)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Handle character associations
  const characterIds = formData.getAll('character_ids') as string[]
  if (characterIds.length > 0 && session) {
    const sessionCharacters = characterIds.map(characterId => ({
      session_id: session.id,
      character_id: characterId,
    }))

    await supabase.from('session_characters').insert(sessionCharacters)
  }

  revalidatePath('/sessions')
  redirect('/sessions')
}

export async function updateSession(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    campaign_id: formData.get('campaign_id') as string || null,
    session_date: formData.get('session_date') as string || null,
    notes: formData.get('notes') as string || null,
  }

  const result = sessionSchema.safeParse(data)
  if (!result.success) {
    throw new Error('Validation failed')
  }

  const { error } = await supabase
    .from('sessions')
    .update(result.data)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  // Update character associations
  const characterIds = formData.getAll('character_ids') as string[]
  
  // Delete existing associations
  await supabase.from('session_characters').delete().eq('session_id', id)
  
  // Insert new associations
  if (characterIds.length > 0) {
    const sessionCharacters = characterIds.map(characterId => ({
      session_id: id,
      character_id: characterId,
    }))

    await supabase.from('session_characters').insert(sessionCharacters)
  }

  revalidatePath('/sessions')
  revalidatePath(`/sessions/${id}`)
  redirect('/sessions')
}

export async function deleteSession(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/sessions')
  redirect('/sessions')
}
