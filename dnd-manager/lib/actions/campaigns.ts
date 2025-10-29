"use server";

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { assertUniqueValue } from '@/lib/supabase/ensure-unique'
import { campaignSchema } from '@/lib/validations/schemas'
import { 
  getIdList, 
  getDateValue, 
  getString, 
  getStringOrNull,
  getName,
  getDescription,
  validateName,
  validateDescription
} from '@/lib/utils/form-data'
import { resolveGroupIds, setCampaignGroups } from '@/lib/actions/groups'
import { extractGroupIds } from '@/lib/groups/helpers'

// List campaigns with pagination
export async function getCampaignsList(
  supabase: SupabaseClient,
  { limit = 20, offset = 0 } = {}
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return data ?? [];
}

const isMissingCampaignCharactersTable = (error: { message?: string | null; code?: string | null } | null | undefined) => {
  if (!error) {
    return false
  }

  const code = error.code?.toUpperCase()
  if (code === '42P01') {
    return true
  }

  const message = error.message?.toLowerCase() ?? ''
  return message.includes('campaign_characters')
}

export async function createCampaignInline(
  name: string,
  description?: string | null,
  groupIds?: string[]
): Promise<{ id: string; name: string }> {
  const supabase = await createClient()

  const sanitizedDescription = description?.trim() || null

  const data = {
    name: name.trim(),
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

  const desiredGroupIds = Array.isArray(groupIds) ? groupIds : []
  const resolvedGroupIds = await resolveGroupIds(
    supabase,
    desiredGroupIds
  )

  const touchedGroupIds = await setCampaignGroups(
    supabase,
    created.id,
    resolvedGroupIds
  )

  revalidatePath('/campaigns')
  if (touchedGroupIds.length > 0) {
    revalidatePath('/groups')
    Array.from(new Set(touchedGroupIds)).forEach((groupId) => {
      revalidatePath(`/groups/${groupId}`)
    })
  }
  return created
}

export async function createCampaign(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const discoveredGroupIds = extractGroupIds(formData)
  const sessionIds = getIdList(formData, 'session_ids')
  const characterIds = getIdList(formData, 'character_ids')
  const createdAtOverride = getDateValue(formData, 'created_at')

  // Validate input fields
  const name = getName(formData, 'name');
  const description = getDescription(formData, 'description');

  if (!validateName(name)) {
    throw new Error("Invalid campaign name. Name must be between 1-100 characters and contain no dangerous content.");
  }
  if (description && !validateDescription(description)) {
    throw new Error("Invalid campaign description. Description must be 2,000 characters or less and contain no dangerous content.");
  }

  const data = {
    name: name,
    description: description || undefined,
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
  const descriptionValue = result.data.description ?? null

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

  const resolvedGroupIds = Array.from(new Set(discoveredGroupIds))
  const touchedGroupIds = await setCampaignGroups(
    supabase,
    campaignId,
    resolvedGroupIds
  )

  const { sessionIds: touchedSessionIds, previousCampaignIds } = await setCampaignSessions(
    supabase,
    campaignId,
    sessionIds
  )

  const touchedCharacterIds = await setCampaignCharacters(
    supabase,
    campaignId,
    characterIds
  )

  if (touchedGroupIds.length > 0) {
    revalidatePath('/groups')
    Array.from(new Set(touchedGroupIds)).forEach((groupId) => {
      revalidatePath(`/groups/${groupId}`)
    })
  }

  if (touchedSessionIds.length > 0) {
    revalidatePath('/sessions')
    Array.from(new Set(touchedSessionIds)).forEach((sessionId) => {
      revalidatePath(`/sessions/${sessionId}`)
    })
  }

  if (previousCampaignIds.length > 0) {
    Array.from(new Set(previousCampaignIds)).forEach((campaignToRefresh) => {
      revalidatePath(`/campaigns/${campaignToRefresh}`)
    })
  }

  if (touchedCharacterIds.length > 0) {
    revalidatePath('/characters')
    Array.from(new Set(touchedCharacterIds)).forEach((characterId) => {
      revalidatePath(`/characters/${characterId}`)
    })
  }

  revalidatePath('/campaigns')
  redirect('/campaigns')
}

export async function updateCampaign(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()

  const discoveredGroupIds = extractGroupIds(formData)
  const sessionIds = getIdList(formData, 'session_ids')
  const characterIds = getIdList(formData, 'character_ids')
  const createdAtOverride = getDateValue(formData, 'created_at')

  const data = {
    name: getString(formData, 'name'),
    description: getStringOrNull(formData, 'description') ?? undefined,
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

  const descriptionValue = result.data.description ?? null

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

  const resolvedGroupIds = Array.from(new Set(discoveredGroupIds))
  const touchedGroupIds = await setCampaignGroups(
    supabase,
    id,
    resolvedGroupIds
  )

  const { sessionIds: touchedSessionIds, previousCampaignIds } = await setCampaignSessions(
    supabase,
    id,
    sessionIds
  )

  const touchedCharacterIds = await setCampaignCharacters(
    supabase,
    id,
    characterIds
  )

  if (touchedGroupIds.length > 0) {
    revalidatePath('/groups')
    Array.from(new Set(touchedGroupIds)).forEach((groupId) => {
      revalidatePath(`/groups/${groupId}`)
    })
  }

  if (touchedSessionIds.length > 0) {
    revalidatePath('/sessions')
    Array.from(new Set(touchedSessionIds)).forEach((sessionId) => {
      revalidatePath(`/sessions/${sessionId}`)
    })
  }

  if (previousCampaignIds.length > 0) {
    Array.from(new Set(previousCampaignIds)).forEach((campaignToRefresh) => {
      revalidatePath(`/campaigns/${campaignToRefresh}`)
    })
  }

  if (touchedCharacterIds.length > 0) {
    revalidatePath('/characters')
    Array.from(new Set(touchedCharacterIds)).forEach((characterId) => {
      revalidatePath(`/characters/${characterId}`)
    })
  }

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


async function setCampaignSessions(
  supabase: SupabaseClient,
  campaignId: string,
  sessionIds: string[],
): Promise<{ sessionIds: string[]; previousCampaignIds: string[] }> {
  const uniqueIds = Array.from(new Set(sessionIds)).filter((id): id is string => Boolean(id))

  const { data: existingRows, error: existingError } = await supabase
    .from('sessions')
    .select('id, campaign_id')
    .eq('campaign_id', campaignId)

  if (existingError) {
    throw new Error(existingError.message)
  }

  const existingIds = (existingRows ?? [])
    .map((row) => row.id)
    .filter((value): value is string => Boolean(value))

  const existingSet = new Set(existingIds)
  const nextSet = new Set(uniqueIds)

  const touchedIds = new Set<string>()
  const previousCampaignIds = new Set<string>()

  existingSet.forEach((sessionId) => {
    if (!nextSet.has(sessionId)) {
      touchedIds.add(sessionId)
    }
  })

  const removalIds = existingIds.filter((current) => !nextSet.has(current))

  if (removalIds.length > 0) {
    const { error: detachError } = await supabase
      .from('sessions')
      .update({ campaign_id: null })
      .in('id', removalIds)

    if (detachError) {
      throw new Error(detachError.message)
    }
  }

  const assignmentMap = new Map<string, string | null>()
  if (nextSet.size > 0) {
    const { data: targetAssignments, error: assignmentError } = await supabase
      .from('sessions')
      .select('id, campaign_id')
      .in('id', Array.from(nextSet))

    if (assignmentError) {
      throw new Error(assignmentError.message)
    }

    targetAssignments?.forEach((row) => {
      if (row?.id) {
        assignmentMap.set(row.id, row.campaign_id ?? null)
      }
    })

    nextSet.forEach((sessionId) => {
      if (!existingSet.has(sessionId)) {
        touchedIds.add(sessionId)
      }
      const previousCampaignId = assignmentMap.get(sessionId)
      if (previousCampaignId && previousCampaignId !== campaignId) {
        previousCampaignIds.add(previousCampaignId)
      }
    })

    const { error: attachError } = await supabase
      .from('sessions')
      .update({ campaign_id: campaignId })
      .in('id', Array.from(nextSet))

    if (attachError) {
      throw new Error(attachError.message)
    }
  }

  return {
    sessionIds: Array.from(touchedIds),
    previousCampaignIds: Array.from(previousCampaignIds),
  }
}

async function setCampaignCharacters(
  supabase: SupabaseClient,
  campaignId: string,
  characterIds: string[],
): Promise<string[]> {
  const uniqueIds = Array.from(new Set(characterIds)).filter((id): id is string => Boolean(id))

  const { data: existingLinks, error: existingError } = await supabase
    .from('campaign_characters')
    .select('character_id')
    .eq('campaign_id', campaignId)

  if (existingError) {
    if (isMissingCampaignCharactersTable(existingError)) {
      return []
    }
    throw new Error(existingError.message)
  }

  const previousIds = new Set<string>()
  existingLinks?.forEach((link) => {
    if (link?.character_id) {
      previousIds.add(link.character_id)
    }
  })

  const nextIds = new Set(uniqueIds)

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
    .from('campaign_characters')
    .delete()
    .eq('campaign_id', campaignId)

  if (deleteError) {
    if (isMissingCampaignCharactersTable(deleteError)) {
      return []
    }
    throw new Error(deleteError.message)
  }

  if (nextIds.size === 0) {
    return Array.from(touchedIds)
  }

  const inserts = Array.from(nextIds).map((characterId) => ({
    campaign_id: campaignId,
    character_id: characterId,
  }))

  const { error: insertError } = await supabase
    .from('campaign_characters')
    .insert(inserts)

  if (insertError) {
    if (isMissingCampaignCharactersTable(insertError)) {
      return []
    }
    throw new Error(insertError.message)
  }

  return Array.from(touchedIds)
}
