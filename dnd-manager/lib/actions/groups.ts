"use server";

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { assertUniqueValue } from '@/lib/supabase/ensure-unique'
import { deleteImage, getStoragePathFromUrl, uploadImage } from '@/lib/supabase/storage'
import { 
  getString, 
  getStringOrNull, 
  getFile, 
  getIdList,
  getName,
  getDescription,
  validateName,
  validateDescription
} from '@/lib/utils/form-data'
import { STORAGE_BUCKETS } from '@/lib/utils/storage'
import { groupSchema, type CharacterGroupAffiliationInput } from '@/lib/validations/group'

// List groups with pagination
export async function getGroupsList(
  supabase: SupabaseClient,
  { limit = 20, offset = 0 } = {}
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return data ?? [];
}

const LOGO_BUCKET = STORAGE_BUCKETS.GROUPS

export async function createGroup(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const groupId = randomUUID()

  const sanitizedName = getName(formData, 'name')

  // Validate name before proceeding
  if (!validateName(sanitizedName)) {
    throw new Error("Invalid group name. Name must be between 1-100 characters and contain no dangerous content.");
  }

  await assertUniqueValue(supabase, {
    table: 'groups',
    column: 'name',
    value: sanitizedName,
    errorMessage: 'Group name already exists. Choose a different name.',
  })

  const description = getDescription(formData, 'description')
  
  // Validate description if provided
  if (description && !validateDescription(description)) {
    throw new Error("Invalid group description. Description must be 2,000 characters or less and contain no dangerous content.");
  }

  const logoFile = getFile(formData, 'logo')
  let logoUrl: string | null = null

  if (logoFile) {
    const { url, error } = await uploadImage(
      LOGO_BUCKET,
      logoFile,
      `groups/${groupId}/logo`
    )

    if (error) {
      throw new Error(`Failed to upload group logo: ${error.message}`)
    }

    logoUrl = url
  }

  const data = {
    name: sanitizedName,
    description,
    logo_url: logoUrl,
  }

  const result = groupSchema.safeParse(data)
  if (!result.success) {
    if (logoUrl) {
      const path = getStoragePathFromUrl(LOGO_BUCKET, logoUrl)
      await deleteImage(LOGO_BUCKET, path)
    }
    throw new Error('Validation failed')
  }

  const { error } = await supabase
    .from('groups')
    .insert({ id: groupId, ...result.data })

  if (error) {
    if (logoUrl) {
      const path = getStoragePathFromUrl(LOGO_BUCKET, logoUrl)
      await deleteImage(LOGO_BUCKET, path)
    }
    throw new Error(error.message)
  }

  revalidatePath('/groups')
  redirect('/groups')
}

export async function updateGroup(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('groups')
    .select('logo_url')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    throw new Error('Group not found')
  }

  const logoFile = getFile(formData, 'logo')
  const removeLogo = formData.get('logo_remove') === 'true'
  let logoUrl = existing.logo_url

  const sanitizedName = getString(formData, 'name')

  await assertUniqueValue(supabase, {
    table: 'groups',
    column: 'name',
    value: sanitizedName,
    excludeId: id,
    errorMessage: 'Group name already exists. Choose a different name.',
  })

  const description = getStringOrNull(formData, 'description')

  if (logoFile) {
    const { url, path, error } = await uploadImage(
      LOGO_BUCKET,
      logoFile,
      `groups/${id}/logo`
    )

    if (error) {
      throw new Error(`Failed to upload group logo: ${error.message}`)
    }

    const previousPath = getStoragePathFromUrl(LOGO_BUCKET, logoUrl)
    if (previousPath && previousPath !== path) {
      const { error: deletePreviousError } = await deleteImage(LOGO_BUCKET, previousPath)

      if (deletePreviousError) {
        console.error('Failed to remove previous group logo', deletePreviousError)
      }
    }

    logoUrl = url
  } else if (removeLogo && logoUrl) {
    const path = getStoragePathFromUrl(LOGO_BUCKET, logoUrl)
    const { error } = await deleteImage(LOGO_BUCKET, path)

    if (error) {
      throw new Error(`Failed to delete group logo: ${error.message}`)
    }

    logoUrl = null
  }

  const data = {
    name: sanitizedName,
    description,
    logo_url: logoUrl,
  }

  const result = groupSchema.safeParse(data)
  if (!result.success) {
    throw new Error('Validation failed')
  }

  const { error } = await supabase
    .from('groups')
    .update(result.data)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  const campaignIds = getIdList(formData, 'campaign_ids')
  const sessionIds = getIdList(formData, 'session_ids')
  const characterIds = getIdList(formData, 'character_ids')

  const touchedCampaignIds = await syncGroupCampaigns(supabase, id, campaignIds)
  const touchedSessionIds = await syncGroupSessions(supabase, id, sessionIds)
  const touchedCharacterIds = await syncGroupCharacters(supabase, id, characterIds)

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

  revalidatePath('/groups')
  revalidatePath(`/groups/${id}`)
  redirect(`/groups/${id}`)
}

export async function deleteGroup(id: string): Promise<void> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('groups')
    .select('logo_url')
    .eq('id', id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(fetchError.message)
  }

  const { data: linkedCampaigns, error: campaignsError } = await supabase
    .from('group_campaigns')
    .select('campaign_id')
    .eq('group_id', id)

  if (campaignsError) {
    throw new Error(campaignsError.message)
  }

  const { data: linkedSessions, error: sessionsError } = await supabase
    .from('group_sessions')
    .select('session_id')
    .eq('group_id', id)

  if (sessionsError) {
    throw new Error(sessionsError.message)
  }

  const { data: linkedCharacters, error: charactersError } = await supabase
    .from('group_characters')
    .select('character_id')
    .eq('group_id', id)

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
    .from('groups')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  if (existing?.logo_url) {
    const path = getStoragePathFromUrl(LOGO_BUCKET, existing.logo_url)
    const { error: deleteError } = await deleteImage(LOGO_BUCKET, path)

    if (deleteError) {
      console.error('Failed to remove group logo from storage', deleteError)
    }
  }

  revalidatePath('/groups')

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

  redirect('/groups')
}

export async function createGroupInline(name: string): Promise<{ id: string; name: string }> {
  const supabase = await createClient()
  const sanitized = name.trim()

  if (!sanitized) {
    throw new Error('Group name is required')
  }

  const truncated = sanitized.slice(0, 200)
  await assertUniqueValue(supabase, {
    table: 'groups',
    column: 'name',
    value: truncated,
    errorMessage: 'Group name already exists. Choose a different name.',
  })
  const groupId = randomUUID()

  const { error } = await supabase
    .from('groups')
    .insert({ id: groupId, name: truncated })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/groups')

  return { id: groupId, name: truncated }
}

export async function resolveGroupIds(
  supabase: SupabaseClient,
  requestedIds: string[]
): Promise<string[]> {
  const unique = Array.from(new Set(requestedIds))

  if (unique.length > 0) {
    return unique
  }

  // Return empty array instead of falling back to oldest group
  return []
}

export async function setCampaignGroups(
  supabase: SupabaseClient,
  campaignId: string,
  groupIds: string[]
): Promise<string[]> {
  const unique = Array.from(new Set(groupIds)).filter((id): id is string => Boolean(id))

  const { data: existingLinks, error: existingError } = await supabase
    .from('group_campaigns')
    .select('group_id')
    .eq('campaign_id', campaignId)

  if (existingError) {
    throw new Error(existingError.message)
  }

  const previousIds = new Set<string>()
  existingLinks?.forEach((link) => {
    if (link?.group_id) {
      previousIds.add(link.group_id)
    }
  })

  const nextIds = new Set(unique)

  const touchedIds = new Set<string>()
  previousIds.forEach((groupId) => {
    if (!nextIds.has(groupId)) {
      touchedIds.add(groupId)
    }
  })
  nextIds.forEach((groupId) => {
    if (!previousIds.has(groupId)) {
      touchedIds.add(groupId)
    }
  })

  const { error: deleteError } = await supabase
    .from('group_campaigns')
    .delete()
    .eq('campaign_id', campaignId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (nextIds.size === 0) {
    return Array.from(touchedIds)
  }

  const inserts = Array.from(nextIds).map((groupId) => ({
    group_id: groupId,
    campaign_id: campaignId,
  }))

  const { error: insertError } = await supabase
    .from('group_campaigns')
    .insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }

  return Array.from(touchedIds)
}

export async function getCampaignGroupIds(
  supabase: SupabaseClient,
  campaignId: string | null
): Promise<string[]> {
  if (!campaignId) {
    return []
  }

  const { data, error } = await supabase
    .from('group_campaigns')
    .select('group_id')
    .eq('campaign_id', campaignId)

  if (error) {
    throw new Error(error.message)
  }

  return data?.map((row) => row.group_id) ?? []
}

export async function setSessionGroups(
  supabase: SupabaseClient,
  sessionId: string,
  groupIds: string[]
): Promise<string[]> {
  const unique = Array.from(new Set(groupIds)).filter((id): id is string => Boolean(id))

  const { data: existingLinks, error: existingError } = await supabase
    .from('group_sessions')
    .select('group_id')
    .eq('session_id', sessionId)

  if (existingError) {
    throw new Error(existingError.message)
  }

  const previousIds = new Set<string>()
  existingLinks?.forEach((link) => {
    if (link?.group_id) {
      previousIds.add(link.group_id)
    }
  })

  const nextIds = new Set(unique)

  const touchedIds = new Set<string>()
  previousIds.forEach((groupId) => {
    if (!nextIds.has(groupId)) {
      touchedIds.add(groupId)
    }
  })
  nextIds.forEach((groupId) => {
    if (!previousIds.has(groupId)) {
      touchedIds.add(groupId)
    }
  })

  const { error: deleteError } = await supabase
    .from('group_sessions')
    .delete()
    .eq('session_id', sessionId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (nextIds.size === 0) {
    return Array.from(touchedIds)
  }

  const inserts = Array.from(nextIds).map((groupId) => ({
    group_id: groupId,
    session_id: sessionId,
  }))

  const { error: insertError } = await supabase
    .from('group_sessions')
    .insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }

  return Array.from(touchedIds)
}

export async function setCharacterGroups(
  supabase: SupabaseClient,
  characterId: string,
  affiliations: CharacterGroupAffiliationInput[]
): Promise<string[]> {
  const deduped = new Map<string, CharacterGroupAffiliationInput>()
  affiliations.forEach((affiliation) => {
    deduped.set(affiliation.groupId, affiliation)
  })

  const finalAffiliations = Array.from(deduped.values())

  const { data: existingLinks, error: existingError } = await supabase
    .from('group_characters')
    .select('group_id, role')
    .eq('character_id', characterId)

  if (existingError) {
    throw new Error(existingError.message)
  }

  const previousIds = new Set<string>()
  const previousRoles = new Map<string, string>()
  existingLinks?.forEach((link) => {
    if (link?.group_id) {
      previousIds.add(link.group_id)
      previousRoles.set(link.group_id, link.role ?? 'npc')
    }
  })

  const nextIds = new Set(finalAffiliations.map((affiliation) => affiliation.groupId))
  const nextRoles = new Map<string, string>()
  finalAffiliations.forEach((affiliation) => {
    nextRoles.set(affiliation.groupId, affiliation.role)
  })

  const touchedIds = new Set<string>()
  previousIds.forEach((groupId) => {
    if (!nextIds.has(groupId)) {
      touchedIds.add(groupId)
    }
  })
  nextIds.forEach((groupId) => {
    if (!previousIds.has(groupId)) {
      touchedIds.add(groupId)
    }
  })
  previousRoles.forEach((previousRole, groupId) => {
    const nextRole = nextRoles.get(groupId)
    if (nextRole && nextRole !== previousRole) {
      touchedIds.add(groupId)
    }
  })

  const { error: deleteError } = await supabase
    .from('group_characters')
    .delete()
    .eq('character_id', characterId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (nextIds.size === 0) {
    return Array.from(touchedIds)
  }

  const inserts = finalAffiliations.map(({ groupId, role }) => ({
    group_id: groupId,
    character_id: characterId,
    role,
  }))

  const { error: insertError } = await supabase
    .from('group_characters')
    .insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }

  return Array.from(touchedIds)
}


async function syncGroupCampaigns(
  supabase: SupabaseClient,
  groupId: string,
  campaignIds: string[]
): Promise<string[]> {
  const uniqueIds = Array.from(new Set(campaignIds)).filter((id): id is string => Boolean(id))

  const { data: existingLinks, error: existingError } = await supabase
    .from('group_campaigns')
    .select('campaign_id')
    .eq('group_id', groupId)

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
    .from('group_campaigns')
    .delete()
    .eq('group_id', groupId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (nextIds.size === 0) {
    return Array.from(touchedIds)
  }

  const inserts = Array.from(nextIds).map((campaignId) => ({
    group_id: groupId,
    campaign_id: campaignId,
  }))

  const { error: insertError } = await supabase
    .from('group_campaigns')
    .insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }

  return Array.from(touchedIds)
}

async function syncGroupSessions(
  supabase: SupabaseClient,
  groupId: string,
  sessionIds: string[]
): Promise<string[]> {
  const uniqueIds = Array.from(new Set(sessionIds)).filter((id): id is string => Boolean(id))

  const { data: existingLinks, error: existingError } = await supabase
    .from('group_sessions')
    .select('session_id')
    .eq('group_id', groupId)

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
    .from('group_sessions')
    .delete()
    .eq('group_id', groupId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (nextIds.size === 0) {
    return Array.from(touchedIds)
  }

  const inserts = Array.from(nextIds).map((sessionId) => ({
    group_id: groupId,
    session_id: sessionId,
  }))

  const { error: insertError } = await supabase
    .from('group_sessions')
    .insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }

  return Array.from(touchedIds)
}

async function syncGroupCharacters(
  supabase: SupabaseClient,
  groupId: string,
  characterIds: string[]
): Promise<string[]> {
  const uniqueIds = Array.from(new Set(characterIds))

  const { data: existingLinks, error: existingError } = await supabase
    .from('group_characters')
    .select('character_id, role')
    .eq('group_id', groupId)

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
    .from('group_characters')
    .delete()
    .eq('group_id', groupId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (uniqueIds.length === 0) {
    return Array.from(touchedIds)
  }

  const inserts = uniqueIds.map((characterId) => ({
    group_id: groupId,
    character_id: characterId,
    role: roleMap.get(characterId) ?? 'npc',
  }))

  const { error: insertError } = await supabase
    .from('group_characters')
    .insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }

  return Array.from(touchedIds)
}

export async function syncSessionGroupsFromCharacters(
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
    // No characters, so no groups
    return await setSessionGroups(supabase, sessionId, [])
  }

  // Get all groups of these characters
  const { data: groupLinks, error: orgsError } = await supabase
    .from('group_characters')
    .select('group_id')
    .in('character_id', characterIds)

  if (orgsError) {
    throw new Error(orgsError.message)
  }

  const groupIds = Array.from(new Set(
    groupLinks?.map(link => link.group_id).filter(Boolean) || []
  ))

  // Update session groups
  return await setSessionGroups(supabase, sessionId, groupIds)
}
