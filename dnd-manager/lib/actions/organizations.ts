"use server";

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { assertUniqueValue } from '@/lib/supabase/ensure-unique'
import { deleteImage, getStoragePathFromUrl, uploadImage } from '@/lib/supabase/storage'
import { sanitizeNullableText, sanitizeText } from '@/lib/security/sanitize'
import { getString, getStringOrNull, getFile, getIdList, getDateValue } from '@/lib/utils/form-data'
import { STORAGE_BUCKETS } from '@/lib/utils/storage'
import { organizationSchema, type CharacterOrganizationAffiliationInput } from '@/lib/validations/organization'

// List organizations with pagination
export async function getOrganizationsList(supabase: SupabaseClient, { limit = 20, offset = 0 } = {}): Promise<any[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return data ?? [];
}

const LOGO_BUCKET = STORAGE_BUCKETS.ORGANIZATIONS

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

  const touchedCampaignIds = await syncOrganizationCampaigns(supabase, id, campaignIds)
  const touchedSessionIds = await syncOrganizationSessions(supabase, id, sessionIds)
  const touchedCharacterIds = await syncOrganizationCharacters(supabase, id, characterIds)

  if (touchedCampaignIds.length > 0) {
    revalidatePath('/campaigns')
    Array.from(new Set(touchedCampaignIds)).forEach((campaignId) => {
      if (campaignId) {
        revalidatePath(`/campaigns/${campaignId}`)
      }
    })
  }

  if (touchedSessionIds.length > 0) {
    revalidatePath('/sessions')
    Array.from(new Set(touchedSessionIds)).forEach((sessionId) => {
      if (sessionId) {
        revalidatePath(`/sessions/${sessionId}`)
      }
    })
  }

  if (touchedCharacterIds.length > 0) {
    revalidatePath('/characters')
    touchedCharacterIds.forEach((characterId) => {
      if (characterId) {
        revalidatePath(`/characters/${characterId}`)
      }
    })
  }

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

  const { data: linkedCampaigns, error: campaignsError } = await supabase
    .from('organization_campaigns')
    .select('campaign_id')
    .eq('organization_id', id)

  if (campaignsError) {
    throw new Error(campaignsError.message)
  }

  const { data: linkedSessions, error: sessionsError } = await supabase
    .from('organization_sessions')
    .select('session_id')
    .eq('organization_id', id)

  if (sessionsError) {
    throw new Error(sessionsError.message)
  }

  const { data: linkedCharacters, error: charactersError } = await supabase
    .from('organization_characters')
    .select('character_id')
    .eq('organization_id', id)

  if (charactersError) {
    throw new Error(charactersError.message)
  }

  const touchedCampaignIds = Array.from(
    new Set(
      (linkedCampaigns ?? [])
        .map((entry) => entry?.campaign_id)
        .filter((value): value is string => Boolean(value))
    )
  )
  const touchedSessionIds = Array.from(
    new Set(
      (linkedSessions ?? [])
        .map((entry) => entry?.session_id)
        .filter((value): value is string => Boolean(value))
    )
  )
  const touchedCharacterIds = Array.from(
    new Set(
      (linkedCharacters ?? [])
        .map((entry) => entry?.character_id)
        .filter((value): value is string => Boolean(value))
    )
  )

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

  if (touchedCampaignIds.length > 0) {
    revalidatePath('/campaigns')
    touchedCampaignIds.forEach((campaignId) => {
      revalidatePath(`/campaigns/${campaignId}`)
    })
  }

  if (touchedSessionIds.length > 0) {
    revalidatePath('/sessions')
    touchedSessionIds.forEach((sessionId) => {
      revalidatePath(`/sessions/${sessionId}`)
    })
  }

  if (touchedCharacterIds.length > 0) {
    revalidatePath('/characters')
    touchedCharacterIds.forEach((characterId) => {
      revalidatePath(`/characters/${characterId}`)
    })
  }

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

  // Return empty array instead of falling back to oldest organization
  return []
}

export async function setCampaignOrganizations(
  supabase: SupabaseClient,
  campaignId: string,
  organizationIds: string[]
): Promise<string[]> {
  const unique = Array.from(new Set(organizationIds)).filter((id): id is string => Boolean(id))

  const { data: existingLinks, error: existingError } = await supabase
    .from('organization_campaigns')
    .select('organization_id')
    .eq('campaign_id', campaignId)

  if (existingError) {
    throw new Error(existingError.message)
  }

  const previousIds = new Set<string>()
  existingLinks?.forEach((link) => {
    if (link?.organization_id) {
      previousIds.add(link.organization_id)
    }
  })

  const nextIds = new Set(unique)

  const touchedIds = new Set<string>()
  previousIds.forEach((organizationId) => {
    if (!nextIds.has(organizationId)) {
      touchedIds.add(organizationId)
    }
  })
  nextIds.forEach((organizationId) => {
    if (!previousIds.has(organizationId)) {
      touchedIds.add(organizationId)
    }
  })

  const { error: deleteError } = await supabase
    .from('organization_campaigns')
    .delete()
    .eq('campaign_id', campaignId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (nextIds.size === 0) {
    return Array.from(touchedIds)
  }

  const inserts = Array.from(nextIds).map((organizationId) => ({
    organization_id: organizationId,
    campaign_id: campaignId,
  }))

  const { error: insertError } = await supabase
    .from('organization_campaigns')
    .insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }

  return Array.from(touchedIds)
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
): Promise<string[]> {
  const unique = Array.from(new Set(organizationIds)).filter((id): id is string => Boolean(id))

  const { data: existingLinks, error: existingError } = await supabase
    .from('organization_sessions')
    .select('organization_id')
    .eq('session_id', sessionId)

  if (existingError) {
    throw new Error(existingError.message)
  }

  const previousIds = new Set<string>()
  existingLinks?.forEach((link) => {
    if (link?.organization_id) {
      previousIds.add(link.organization_id)
    }
  })

  const nextIds = new Set(unique)

  const touchedIds = new Set<string>()
  previousIds.forEach((organizationId) => {
    if (!nextIds.has(organizationId)) {
      touchedIds.add(organizationId)
    }
  })
  nextIds.forEach((organizationId) => {
    if (!previousIds.has(organizationId)) {
      touchedIds.add(organizationId)
    }
  })

  const { error: deleteError } = await supabase
    .from('organization_sessions')
    .delete()
    .eq('session_id', sessionId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (nextIds.size === 0) {
    return Array.from(touchedIds)
  }

  const inserts = Array.from(nextIds).map((organizationId) => ({
    organization_id: organizationId,
    session_id: sessionId,
  }))

  const { error: insertError } = await supabase
    .from('organization_sessions')
    .insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }

  return Array.from(touchedIds)
}

export async function setCharacterOrganizations(
  supabase: SupabaseClient,
  characterId: string,
  affiliations: CharacterOrganizationAffiliationInput[]
): Promise<string[]> {
  const deduped = new Map<string, CharacterOrganizationAffiliationInput>()
  affiliations.forEach((affiliation) => {
    deduped.set(affiliation.organizationId, affiliation)
  })

  const finalAffiliations = Array.from(deduped.values())

  const { data: existingLinks, error: existingError } = await supabase
    .from('organization_characters')
    .select('organization_id, role')
    .eq('character_id', characterId)

  if (existingError) {
    throw new Error(existingError.message)
  }

  const previousIds = new Set<string>()
  const previousRoles = new Map<string, string>()
  existingLinks?.forEach((link) => {
    if (link?.organization_id) {
      previousIds.add(link.organization_id)
      previousRoles.set(link.organization_id, link.role ?? 'npc')
    }
  })

  const nextIds = new Set(finalAffiliations.map((affiliation) => affiliation.organizationId))
  const nextRoles = new Map<string, string>()
  finalAffiliations.forEach((affiliation) => {
    nextRoles.set(affiliation.organizationId, affiliation.role)
  })

  const touchedIds = new Set<string>()
  previousIds.forEach((organizationId) => {
    if (!nextIds.has(organizationId)) {
      touchedIds.add(organizationId)
    }
  })
  nextIds.forEach((organizationId) => {
    if (!previousIds.has(organizationId)) {
      touchedIds.add(organizationId)
    }
  })
  previousRoles.forEach((previousRole, organizationId) => {
    const nextRole = nextRoles.get(organizationId)
    if (nextRole && nextRole !== previousRole) {
      touchedIds.add(organizationId)
    }
  })

  const { error: deleteError } = await supabase
    .from('organization_characters')
    .delete()
    .eq('character_id', characterId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (nextIds.size === 0) {
    return Array.from(touchedIds)
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

  return Array.from(touchedIds)
}


async function syncOrganizationCampaigns(
  supabase: SupabaseClient,
  organizationId: string,
  campaignIds: string[]
): Promise<string[]> {
  const uniqueIds = Array.from(new Set(campaignIds)).filter((id): id is string => Boolean(id))

  const { data: existingLinks, error: existingError } = await supabase
    .from('organization_campaigns')
    .select('campaign_id')
    .eq('organization_id', organizationId)

  if (existingError) {
    throw new Error(existingError.message)
  }

  const previousIds = new Set<string>()
  existingLinks?.forEach((link) => {
    if (link?.campaign_id) {
      previousIds.add(link.campaign_id)
    }
  })

  const nextIds = new Set(uniqueIds)

  const touchedIds = new Set<string>()
  previousIds.forEach((campaignId) => {
    if (!nextIds.has(campaignId)) {
      touchedIds.add(campaignId)
    }
  })
  nextIds.forEach((campaignId) => {
    if (!previousIds.has(campaignId)) {
      touchedIds.add(campaignId)
    }
  })

  const { error: deleteError } = await supabase
    .from('organization_campaigns')
    .delete()
    .eq('organization_id', organizationId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (nextIds.size === 0) {
    return Array.from(touchedIds)
  }

  const inserts = Array.from(nextIds).map((campaignId) => ({
    organization_id: organizationId,
    campaign_id: campaignId,
  }))

  const { error: insertError } = await supabase
    .from('organization_campaigns')
    .insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }

  return Array.from(touchedIds)
}

async function syncOrganizationSessions(
  supabase: SupabaseClient,
  organizationId: string,
  sessionIds: string[]
): Promise<string[]> {
  const uniqueIds = Array.from(new Set(sessionIds)).filter((id): id is string => Boolean(id))

  const { data: existingLinks, error: existingError } = await supabase
    .from('organization_sessions')
    .select('session_id')
    .eq('organization_id', organizationId)

  if (existingError) {
    throw new Error(existingError.message)
  }

  const previousIds = new Set<string>()
  existingLinks?.forEach((link) => {
    if (link?.session_id) {
      previousIds.add(link.session_id)
    }
  })

  const nextIds = new Set(uniqueIds)

  const touchedIds = new Set<string>()
  previousIds.forEach((sessionId) => {
    if (!nextIds.has(sessionId)) {
      touchedIds.add(sessionId)
    }
  })
  nextIds.forEach((sessionId) => {
    if (!previousIds.has(sessionId)) {
      touchedIds.add(sessionId)
    }
  })

  const { error: deleteError } = await supabase
    .from('organization_sessions')
    .delete()
    .eq('organization_id', organizationId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (nextIds.size === 0) {
    return Array.from(touchedIds)
  }

  const inserts = Array.from(nextIds).map((sessionId) => ({
    organization_id: organizationId,
    session_id: sessionId,
  }))

  const { error: insertError } = await supabase
    .from('organization_sessions')
    .insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }

  return Array.from(touchedIds)
}

async function syncOrganizationCharacters(
  supabase: SupabaseClient,
  organizationId: string,
  characterIds: string[]
): Promise<string[]> {
  const uniqueIds = Array.from(new Set(characterIds))

  const { data: existingLinks, error: existingError } = await supabase
    .from('organization_characters')
    .select('character_id, role')
    .eq('organization_id', organizationId)

  if (existingError) {
    throw new Error(existingError.message)
  }

  const previousIds = new Set<string>()
  const roleMap = new Map<string, string>()
  existingLinks?.forEach((link) => {
    if (link?.character_id) {
      previousIds.add(link.character_id)
      roleMap.set(link.character_id, link.role ?? 'npc')
    }
  })

  const nextIds = new Set(uniqueIds.filter(Boolean))

  const touchedIds = new Set<string>()
  previousIds.forEach((characterId) => {
    if (!nextIds.has(characterId)) {
      touchedIds.add(characterId)
    }
  })
  nextIds.forEach((characterId) => {
    if (!previousIds.has(characterId)) {
      touchedIds.add(characterId)
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
    return Array.from(touchedIds)
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

  return Array.from(touchedIds)
}

export async function syncSessionOrganizationsFromCharacters(
  supabase: SupabaseClient,
  sessionId: string
): Promise<string[]> {
  // Get all characters in this session
  const { data: sessionCharacters, error: charsError } = await supabase
    .from('session_characters')
    .select('character_id')
    .eq('session_id', sessionId)

  if (charsError) {
    throw new Error(charsError.message)
  }

  const characterIds = sessionCharacters?.map(sc => sc.character_id) || []

  if (characterIds.length === 0) {
    // No characters, so no organizations
    return await setSessionOrganizations(supabase, sessionId, [])
  }

  // Get all organizations of these characters
  const { data: organizationLinks, error: orgsError } = await supabase
    .from('organization_characters')
    .select('organization_id')
    .in('character_id', characterIds)

  if (orgsError) {
    throw new Error(orgsError.message)
  }

  const organizationIds = Array.from(new Set(
    organizationLinks?.map(link => link.organization_id).filter(Boolean) || []
  ))

  // Update session organizations
  return await setSessionOrganizations(supabase, sessionId, organizationIds)
}
