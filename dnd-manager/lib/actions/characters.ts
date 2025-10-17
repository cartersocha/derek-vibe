'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { characterSchema } from '@/lib/validations/schemas'

export async function createCharacter(formData: FormData): Promise<void> {
  const supabase = await createClient()

  // Helper to convert empty strings to null
  const getStringOrNull = (key: string) => {
    const value = formData.get(key) as string
    return value && value.trim() !== '' ? value : null
  }

  const getNumberOrNull = (key: string) => {
    const value = formData.get(key) as string
    return value && value.trim() !== '' ? parseInt(value) : null
  }

  const data = {
    name: formData.get('name') as string,
    race: getStringOrNull('race'),
    class: getStringOrNull('class'),
    level: getNumberOrNull('level'),
    backstory: getStringOrNull('backstory'),
    strength: getNumberOrNull('strength'),
    dexterity: getNumberOrNull('dexterity'),
    constitution: getNumberOrNull('constitution'),
    intelligence: getNumberOrNull('intelligence'),
    wisdom: getNumberOrNull('wisdom'),
    charisma: getNumberOrNull('charisma'),
  }

  const result = characterSchema.safeParse(data)
  if (!result.success) {
    console.error('Validation errors:', result.error.format())
    throw new Error('Validation failed: ' + JSON.stringify(result.error.format()))
  }

  const { error } = await supabase
    .from('characters')
    .insert(result.data)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/characters')
  redirect('/characters')
}

export async function updateCharacter(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    race: formData.get('race') as string || null,
    class: formData.get('class') as string || null,
    level: formData.get('level') ? parseInt(formData.get('level') as string) : null,
    backstory: formData.get('backstory') as string || null,
    strength: formData.get('strength') ? parseInt(formData.get('strength') as string) : null,
    dexterity: formData.get('dexterity') ? parseInt(formData.get('dexterity') as string) : null,
    constitution: formData.get('constitution') ? parseInt(formData.get('constitution') as string) : null,
    intelligence: formData.get('intelligence') ? parseInt(formData.get('intelligence') as string) : null,
    wisdom: formData.get('wisdom') ? parseInt(formData.get('wisdom') as string) : null,
    charisma: formData.get('charisma') ? parseInt(formData.get('charisma') as string) : null,
  }

  const result = characterSchema.safeParse(data)
  if (!result.success) {
    throw new Error('Validation failed')
  }

  const { error } = await supabase
    .from('characters')
    .update(result.data)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/characters')
  revalidatePath(`/characters/${id}`)
  redirect('/characters')
}

export async function deleteCharacter(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/characters')
  redirect('/characters')
}
