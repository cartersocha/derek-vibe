'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { campaignSchema } from '@/lib/validations/schemas'

export async function createCampaign(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
  }

  const result = campaignSchema.safeParse(data)
  if (!result.success) {
    throw new Error('Validation failed')
  }

  const { error } = await supabase
    .from('campaigns')
    .insert(result.data)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/campaigns')
  redirect('/campaigns')
}

export async function updateCampaign(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
  }

  const result = campaignSchema.safeParse(data)
  if (!result.success) {
    throw new Error('Validation failed')
  }

  const { error } = await supabase
    .from('campaigns')
    .update(result.data)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/campaigns')
  revalidatePath(`/campaigns/${id}`)
  redirect('/campaigns')
}

export async function deleteCampaign(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/campaigns')
  redirect('/campaigns')
}
