"use server";

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { assertUniqueValue } from '@/lib/supabase/ensure-unique'
import { getDescription, getName, getStringOrNull, validateDescription, validateName } from '@/lib/utils/form-data'
import { locationSchema } from '@/lib/validations/schemas'

export async function getLocationsList(
  supabase: SupabaseClient,
  { limit = 20, offset = 0 } = {}
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createLocation(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const name = getName(formData, 'name')
  if (!validateName(name)) {
    throw new Error('Invalid location name. Name must be between 1-100 characters and contain no dangerous content.')
  }

  await assertUniqueValue(supabase, {
    table: 'locations',
    column: 'name',
    value: name,
    errorMessage: 'Location name already exists. Choose a different name.',
  })

  const description = getDescription(formData, 'description')
  if (description && !validateDescription(description)) {
    throw new Error('Invalid description. Description must be 2,000 characters or less and contain no dangerous content.')
  }

  const headerImageUrl = getStringOrNull(formData, 'header_image_url')

  const payload = {
    name,
    description: description || null,
    header_image_url: headerImageUrl,
  }

  const parsed = locationSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error('Validation failed')
  }

  const locationId = randomUUID()
  const { error } = await supabase.from('locations').insert({ id: locationId, ...parsed.data })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/locations')
  redirect('/locations')
}

export async function updateLocation(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()

  const name = getName(formData, 'name')
  if (!validateName(name)) {
    throw new Error('Invalid location name. Name must be between 1-100 characters and contain no dangerous content.')
  }

  const description = getDescription(formData, 'description')
  if (description && !validateDescription(description)) {
    throw new Error('Invalid description. Description must be 2,000 characters or less and contain no dangerous content.')
  }

  const headerImageUrl = getStringOrNull(formData, 'header_image_url')

  const payload = {
    name,
    description: description || null,
    header_image_url: headerImageUrl,
  }

  const parsed = locationSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error('Validation failed')
  }

  const { error } = await supabase
    .from('locations')
    .update(parsed.data)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/locations')
  revalidatePath(`/locations/${id}`)
  redirect(`/locations/${id}`)
}

export async function deleteLocation(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/locations')
}
