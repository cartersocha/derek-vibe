"use server";
// List organizations with pagination, user scoping, and authorization
export async function getOrganizationsList(supabase: SupabaseClient, userId: string, { limit = 20, offset = 0 } = {}): Promise<any[]> {
  if (!userId) throw new Error('Unauthorized: Missing userId');
  const { data, error } = await supabase
    .from('organizations')
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
import { deleteImage, getStoragePathFromUrl, uploadImage } from '@/lib/supabase/storage'
import { sanitizeNullableText, sanitizeText } from '@/lib/security/sanitize'
import { organizationSchema, type CharacterOrganizationAffiliationInput } from '@/lib/validations/organization'

const LOGO_BUCKET = 'organization-logos' as const

export async function createOrganization(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const organizationId = randomUUID()

  const rawName = getString(formData, 'name')
  const sanitizedName = sanitizeText(rawName).trim()

  await assertUniqueValue(supabase, {
    table: 'organizations',
    column: 'name',
    value: sanitizedName,
    errorMessage: 'Organization name already exists. Choose a different name.',
  })

  const description = sanitizeNullableText(formData.get('description'))

  const logoFile = getFile(formData, 'logo')
  let logoUrl: string | null = null

  if (logoFile) {
    const { url, error } = await uploadImage(
      LOGO_BUCKET,
      logoFile,
      `organizations/${organizationId}/logo`
    )

    if (error) {
      throw new Error(`Failed to upload organization logo: ${error.message}`)
    }

    logoUrl = url
  }

  const data = {
    name: sanitizedName,
    description,
    logo_url: logoUrl,
  }

  const result = organizationSchema.safeParse(data)
  if (!result.success) {
    if (logoUrl) {
      const path = getStoragePathFromUrl(LOGO_BUCKET, logoUrl)
      await deleteImage(LOGO_BUCKET, path)
    }
    throw new Error('Validation failed')
  }

  const { error } = await supabase
    .from('organizations')
    .insert({ id: organizationId, ...result.data })

  if (error) {
    if (logoUrl) {
      const path = getStoragePathFromUrl(LOGO_BUCKET, logoUrl)
      await deleteImage(LOGO_BUCKET, path)
    }
    throw new Error(error.message)
  }

  revalidatePath('/organizations')
  redirect('/organizations')
}

export async function updateOrganization(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('organizations')
    .select('logo_url')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    throw new Error('Organization not found')
  }

  const logoFile = getFile(formData, 'logo')
  const removeLogo = formData.get('logo_remove') === 'true'
  let logoUrl = existing.logo_url

  const rawName = getString(formData, 'name')
  const sanitizedName = sanitizeText(rawName).trim()

  await assertUniqueValue(supabase, {
    table: 'organizations',
    column: 'name',
    value: sanitizedName,
    excludeId: id,
    errorMessage: 'Organization name already exists. Choose a different name.',
  })

  const description = sanitizeNullableText(formData.get('description'))

  if (logoFile) {
    const { url, path, error } = await uploadImage(
      LOGO_BUCKET,
      logoFile,
      `organizations/${id}/logo`
    )

    if (error) {
      throw new Error(`Failed to upload organization logo: ${error.message}`)
    }

    const previousPath = getStoragePathFromUrl(LOGO_BUCKET, logoUrl)
    if (previousPath && previousPath !== path) {
      const { error: deletePreviousError } = await deleteImage(LOGO_BUCKET, previousPath)

      if (deletePreviousError) {
        console.error('Failed to remove previous organization logo', deletePreviousError)
      }
    }

    logoUrl = url
  } else if (removeLogo && logoUrl) {
    const path = getStoragePathFromUrl(LOGO_BUCKET, logoUrl)
    const { error } = await deleteImage(LOGO_BUCKET, path)

    if (error) {
      throw new Error(`Failed to delete organization logo: ${error.message}`)
    }

    logoUrl = null
  }

  const data = {
    name: sanitizedName,
    description,
    logo_url: logoUrl,
  }

  const result = organizationSchema.safeParse(data)
  if (!result.success) {
    throw new Error('Validation failed')
  }

  const { error } = await supabase
    .from('organizations')
    .update(result.data)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  const campaignIds = getIdList(formData, 'campaign_ids')
  const sessionIds = getIdList(formData, 'session_ids')
  const characterIds = getIdList(formData, 'character_ids')

  await syncOrganizationCampaigns(supabase, id, campaignIds)
  await syncOrganizationSessions(supabase, id, sessionIds)
  await syncOrganizationCharacters(supabase, id, characterIds)

  revalidatePath('/organizations')
  revalidatePath(`/organizations/${id}`)
  redirect(`/organizations/${id}`)
}

export async function deleteOrganization(id: string): Promise<void> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('organizations')
    .select('logo_url')
    .eq('id', id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(fetchError.message)
  }

  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  if (existing?.logo_url) {
    const path = getStoragePathFromUrl(LOGO_BUCKET, existing.logo_url)
    const { error: deleteError } = await deleteImage(LOGO_BUCKET, path)

    if (deleteError) {
      console.error('Failed to remove organization logo from storage', deleteError)
    }
  }

  revalidatePath('/organizations')
  redirect('/organizations')
}

export async function createOrganizationInline(name: string): Promise<{ id: string; name: string }> {
  const supabase = await createClient()
  const sanitized = sanitizeText(name).trim()

  if (!sanitized) {
    throw new Error('Organization name is required')
  }

  const truncated = sanitized.slice(0, 200)
  await assertUniqueValue(supabase, {
    table: 'organizations',
    column: 'name',
    value: truncated,
    errorMessage: 'Organization name already exists. Choose a different name.',
  })
  const organizationId = randomUUID()

  const { error } = await supabase
    .from('organizations')
    .insert({ id: organizationId, name: truncated })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/organizations')

  return { id: organizationId, name: truncated }
}

export async function resolveOrganizationIds(
  supabase: SupabaseClient,
  requestedIds: string[]
): Promise<string[]> {
  const unique = Array.from(new Set(requestedIds))

  if (unique.length > 0) {
    return unique
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)

  if (error) {
    throw new Error(error.message)
  }

  const fallback = data?.[0]?.id
  return fallback ? [fallback] : []
}

export async function setCampaignOrganizations(
  supabase: SupabaseClient,
  campaignId: string,
  organizationIds: string[]
): Promise<void> {
  const unique = Array.from(new Set(organizationIds))

  const { error: deleteError } = await supabase
    .from('organization_campaigns')
    .delete()
    .eq('campaign_id', campaignId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (unique.length === 0) {
    return
  }

  const inserts = unique.map((organizationId) => ({
    organization_id: organizationId,
    campaign_id: campaignId,
  }))

  const { error: insertError } = await supabase
    .from('organization_campaigns')
    .insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }
}

export async function getCampaignOrganizationIds(
  supabase: SupabaseClient,
  campaignId: string | null
): Promise<string[]> {
  if (!campaignId) {
    return []
  }

  const { data, error } = await supabase
    .from('organization_campaigns')
    .select('organization_id')
    .eq('campaign_id', campaignId)

  if (error) {
    throw new Error(error.message)
  }

  return data?.map((row) => row.organization_id) ?? []
}

export async function setSessionOrganizations(
  supabase: SupabaseClient,
  sessionId: string,
  organizationIds: string[]
): Promise<void> {
  const unique = Array.from(new Set(organizationIds))

  const { error: deleteError } = await supabase
    .from('organization_sessions')
    .delete()
    .eq('session_id', sessionId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (unique.length === 0) {
    return
  }

  const inserts = unique.map((organizationId) => ({
    organization_id: organizationId,
    session_id: sessionId,
  }))

  const { error: insertError } = await supabase
    .from('organization_sessions')
    .insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }
}

export async function setCharacterOrganizations(
  supabase: SupabaseClient,
  characterId: string,
  affiliations: CharacterOrganizationAffiliationInput[]
): Promise<void> {
  const deduped = new Map<string, CharacterOrganizationAffiliationInput>()
  affiliations.forEach((affiliation) => {
    deduped.set(affiliation.organizationId, affiliation)
  })

  const finalAffiliations = Array.from(deduped.values())

  const { error: deleteError } = await supabase
    .from('organization_characters')
    .delete()
    .eq('character_id', characterId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (finalAffiliations.length === 0) {
    return
  }

  const inserts = finalAffiliations.map(({ organizationId, role }) => ({
    organization_id: organizationId,
    character_id: characterId,
    role,
  }))

  const { error: insertError } = await supabase
    .from('organization_characters')
    .insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }
}

function getString(formData: FormData, key: string): string {
  const value = formData.get(key)

  if (typeof value !== 'string') {
    return ''
  }

  return value
}

function getFile(formData: FormData, key: string): File | null {
  const value = formData.get(key)

  if (value instanceof File && value.size > 0) {
    return value
  }

  return null
}

function getIdList(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .flatMap((value) => (typeof value === 'string' && value.trim() ? [value.trim()] : []))
}

async function syncOrganizationCampaigns(
  supabase: SupabaseClient,
  organizationId: string,
  campaignIds: string[]
): Promise<void> {
  const uniqueIds = Array.from(new Set(campaignIds))

  const { error: deleteError } = await supabase
    .from('organization_campaigns')
    .delete()
    .eq('organization_id', organizationId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (uniqueIds.length === 0) {
    return
  }

  const inserts = uniqueIds.map((campaignId) => ({
    organization_id: organizationId,
    campaign_id: campaignId,
  }))

  const { error: insertError } = await supabase
    .from('organization_campaigns')
    .insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }
}

async function syncOrganizationSessions(
  supabase: SupabaseClient,
  organizationId: string,
  sessionIds: string[]
): Promise<void> {
  const uniqueIds = Array.from(new Set(sessionIds))

  const { error: deleteError } = await supabase
    .from('organization_sessions')
    .delete()
    .eq('organization_id', organizationId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (uniqueIds.length === 0) {
    return
  }

  const inserts = uniqueIds.map((sessionId) => ({
    organization_id: organizationId,
    session_id: sessionId,
  }))

  const { error: insertError } = await supabase
    .from('organization_sessions')
    .insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }
}

async function syncOrganizationCharacters(
  supabase: SupabaseClient,
  organizationId: string,
  characterIds: string[]
): Promise<void> {
  const uniqueIds = Array.from(new Set(characterIds))

  const { data: existingLinks, error: existingError } = await supabase
    .from('organization_characters')
    .select('character_id, role')
    .eq('organization_id', organizationId)

  if (existingError) {
    throw new Error(existingError.message)
  }

  const roleMap = new Map<string, string>()
  existingLinks?.forEach((link) => {
    if (link?.character_id) {
      roleMap.set(link.character_id, link.role ?? 'npc')
    }
  })

  const { error: deleteError } = await supabase
    .from('organization_characters')
    .delete()
    .eq('organization_id', organizationId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (uniqueIds.length === 0) {
    return
  }

  const inserts = uniqueIds.map((characterId) => ({
    organization_id: organizationId,
    character_id: characterId,
    role: roleMap.get(characterId) ?? 'npc',
  }))

  const { error: insertError } = await supabase
    .from('organization_characters')
    .insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }
}
