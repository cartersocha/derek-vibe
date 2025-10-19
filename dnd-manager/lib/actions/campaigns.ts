"use server";
// List campaigns with pagination, user scoping, and authorization
export async function getCampaignsList(supabase: SupabaseClient, userId: string, { limit = 20, offset = 0 } = {}): Promise<any[]> {
  if (!userId) throw new Error('Unauthorized: Missing userId');
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return data ?? [];
}

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { assertUniqueValue } from '@/lib/supabase/ensure-unique'
import { campaignSchema } from '@/lib/validations/schemas'
import { sanitizeNullableText, sanitizeText } from '@/lib/security/sanitize'
import { resolveOrganizationIds, setCampaignOrganizations } from '@/lib/actions/organizations'
import { extractOrganizationIds } from '@/lib/organizations/helpers'

export async function createCampaignInline(
  name: string,
  description?: string | null,
  organizationIds?: string[]
): Promise<{ id: string; name: string }> {
  const supabase = await createClient()

  const sanitizedDescription = sanitizeNullableText(description ?? null)

  const data = {
    name: sanitizeText(name).trim(),
    description: sanitizedDescription ?? undefined,
  }

  const result = campaignSchema.safeParse(data)
  if (!result.success) {
    throw new Error('Validation failed')
  }

  await assertUniqueValue(supabase, {
    table: 'campaigns',
    column: 'name',
    value: result.data.name,
    errorMessage: 'Campaign name already exists. Choose a different name.',
  })

  const campaignId = randomUUID()

  const { data: created, error } = await supabase
    .from('campaigns')
    .insert({ id: campaignId, ...result.data })
    .select('id, name')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (!created) {
    throw new Error('Failed to create campaign')
  }

  const desiredOrganizationIds = Array.isArray(organizationIds) ? organizationIds : []
  const resolvedOrganizationIds = await resolveOrganizationIds(
    supabase,
    desiredOrganizationIds
  )

  await setCampaignOrganizations(supabase, created.id, resolvedOrganizationIds)

  revalidatePath('/campaigns')
  if (resolvedOrganizationIds.length > 0) {
    revalidatePath('/organizations')
  }
  return created
}

export async function createCampaign(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const discoveredOrganizationIds = extractOrganizationIds(formData)
  const sessionIds = getIdList(formData, 'session_ids')
  const characterIds = getIdList(formData, 'character_ids')
  const createdAtOverride = getDateValue(formData, 'created_at')

  const rawName = formData.get('name')
  const sanitizedDescription = sanitizeNullableText(formData.get('description'))
  const data = {
    name: typeof rawName === 'string' ? sanitizeText(rawName).trim() : '',
    description: sanitizedDescription ?? undefined,
  }

  const result = campaignSchema.safeParse(data)
  if (!result.success) {
    throw new Error('Validation failed')
  }

  await assertUniqueValue(supabase, {
    table: 'campaigns',
    column: 'name',
    value: result.data.name,
    errorMessage: 'Campaign name already exists. Choose a different name.',
  })

  const campaignId = randomUUID()
  const descriptionValue = sanitizedDescription ?? null

  const { error } = await supabase
    .from('campaigns')
    .insert({
      id: campaignId,
      name: result.data.name,
      description: descriptionValue,
      ...(createdAtOverride ? { created_at: createdAtOverride } : {}),
    })

  if (error) {
    throw new Error(error.message)
  }

  const resolvedOrganizationIds = Array.from(new Set(discoveredOrganizationIds))
  await setCampaignOrganizations(supabase, campaignId, resolvedOrganizationIds)

  await setCampaignSessions(supabase, campaignId, sessionIds)
  await setCampaignCharacters(supabase, campaignId, characterIds)

  revalidatePath('/organizations')
  revalidatePath('/sessions')
  revalidatePath('/characters')
  revalidatePath('/campaigns')
  redirect('/campaigns')
}

export async function updateCampaign(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()

  const discoveredOrganizationIds = extractOrganizationIds(formData)
  const sessionIds = getIdList(formData, 'session_ids')
  const characterIds = getIdList(formData, 'character_ids')
  const createdAtOverride = getDateValue(formData, 'created_at')

  const rawName = formData.get('name')
  const sanitizedDescription = sanitizeNullableText(formData.get('description'))
  const data = {
    name: typeof rawName === 'string' ? sanitizeText(rawName).trim() : '',
    description: sanitizedDescription ?? undefined,
  }

  const result = campaignSchema.safeParse(data)
  if (!result.success) {
    throw new Error('Validation failed')
  }

  await assertUniqueValue(supabase, {
    table: 'campaigns',
    column: 'name',
    value: result.data.name,
    excludeId: id,
    errorMessage: 'Campaign name already exists. Choose a different name.',
  })

  const descriptionValue = sanitizedDescription ?? null

  const { error } = await supabase
    .from('campaigns')
    .update({
      name: result.data.name,
      description: descriptionValue,
      ...(createdAtOverride ? { created_at: createdAtOverride } : {}),
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  const resolvedOrganizationIds = Array.from(new Set(discoveredOrganizationIds))
  await setCampaignOrganizations(supabase, id, resolvedOrganizationIds)

  await setCampaignSessions(supabase, id, sessionIds)
  await setCampaignCharacters(supabase, id, characterIds)

  revalidatePath('/organizations')
  revalidatePath('/sessions')
  revalidatePath('/characters')
  revalidatePath('/campaigns')
  revalidatePath(`/campaigns/${id}`)
  redirect(`/campaigns/${id}`)
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

function getIdList(formData: FormData, field: string): string[] {
  const rawValues = formData
    .getAll(field)
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean)

  return Array.from(new Set(rawValues))
}

function getDateValue(formData: FormData, field: string): string | null {
  const rawValue = formData.get(field)
  if (typeof rawValue !== 'string') {
    return null
  }

  const trimmed = rawValue.trim()
  if (!trimmed) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map((value) => Number.parseInt(value, 10))
    if ([year, month, day].some((value) => Number.isNaN(value))) {
      return null
    }

    return new Date(Date.UTC(year, month - 1, day)).toISOString()
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString()
}

async function setCampaignSessions(
  supabase: SupabaseClient,
  campaignId: string,
  sessionIds: string[],
): Promise<void> {
  const uniqueIds = Array.from(new Set(sessionIds))

  const { data: existingRows, error: existingError } = await supabase
    .from('sessions')
    .select('id')
    .eq('campaign_id', campaignId)

  if (existingError) {
    throw new Error(existingError.message)
  }

  const existingIds = (existingRows ?? []).map((row) => row.id)
  const removalIds = existingIds.filter((current) => !uniqueIds.includes(current))

  if (removalIds.length > 0) {
    const { error: detachError } = await supabase
      .from('sessions')
      .update({ campaign_id: null })
      .in('id', removalIds)

    if (detachError) {
      throw new Error(detachError.message)
    }
  }

  if (uniqueIds.length > 0) {
    const { error: attachError } = await supabase
      .from('sessions')
      .update({ campaign_id: campaignId })
      .in('id', uniqueIds)

    if (attachError) {
      throw new Error(attachError.message)
    }
  }
}

async function setCampaignCharacters(
  supabase: SupabaseClient,
  campaignId: string,
  characterIds: string[],
): Promise<void> {
  const uniqueIds = Array.from(new Set(characterIds))

  const { error: deleteError } = await supabase
    .from('campaign_characters')
    .delete()
    .eq('campaign_id', campaignId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (uniqueIds.length === 0) {
    return
  }

  const inserts = uniqueIds.map((characterId) => ({
    campaign_id: campaignId,
    character_id: characterId,
  }))

  const { error: insertError } = await supabase
    .from('campaign_characters')
    .insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }
}
