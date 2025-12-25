"use server";

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { assertUniqueValue } from '@/lib/supabase/ensure-unique'
import { uploadImage, deleteImage, getStoragePathFromUrl } from '@/lib/supabase/storage'
import {
  getName,
  getDescription,
  getStringOrNull,
  getIdList,
  getString,
  validateName,
  validateDescription,
} from '@/lib/utils/form-data'
import { STORAGE_BUCKETS } from '@/lib/utils/storage'
import { locationSchema } from '@/lib/validations/location'

const LOCATION_BUCKET = STORAGE_BUCKETS.LOCATION_MAPS

async function syncJoinTable(
  supabase: SupabaseClient,
  table: string,
  locationId: string,
  column: string,
  ids: string[],
) {
  const { data: existingRows } = await supabase
    .from(table)
    .select(column)
    .eq('location_id', locationId)

  const existingIds = (existingRows ?? []).map((row) => row[column as keyof typeof row] as string)

  const desiredIds = Array.from(new Set(ids.filter(Boolean)))
  const toInsert = desiredIds.filter((id) => !existingIds.includes(id))
  const toDelete = existingIds.filter((id) => !desiredIds.includes(id))

  if (toInsert.length > 0) {
    await supabase.from(table).insert(
      toInsert.map((id) => ({ location_id: locationId, [column]: id })),
    )
  }

  if (toDelete.length > 0) {
    await supabase
      .from(table)
      .delete()
      .eq('location_id', locationId)
      .in(column, toDelete)
  }

  return { inserted: toInsert, removed: toDelete }
}

function revalidateForLocation(locationId: string, touched: { campaigns?: string[]; sessions?: string[]; characters?: string[]; groups?: string[] }) {
  revalidatePath('/locations')
  revalidatePath(`/locations/${locationId}`)

  if (touched.campaigns) {
    revalidatePath('/campaigns')
    touched.campaigns.forEach((id) => revalidatePath(`/campaigns/${id}`))
  }

  if (touched.sessions) {
    revalidatePath('/sessions')
    touched.sessions.forEach((id) => revalidatePath(`/sessions/${id}`))
  }

  if (touched.characters) {
    revalidatePath('/characters')
    touched.characters.forEach((id) => revalidatePath(`/characters/${id}`))
  }

  if (touched.groups) {
    revalidatePath('/groups')
    touched.groups.forEach((id) => revalidatePath(`/groups/${id}`))
  }
}

export async function createLocationInline(name: string): Promise<{ id: string; name: string }> {
  const supabase = await createClient()

  const sanitizedName = name.trim()
  if (!validateName(sanitizedName)) {
    throw new Error('Invalid location name. Provide a name between 1-100 characters without dangerous content.')
  }

  await assertUniqueValue(supabase, {
    table: 'locations',
    column: 'name',
    value: sanitizedName,
    errorMessage: 'A location with this name already exists.',
  })

  const locationId = randomUUID()
  const validation = locationSchema.safeParse({
    name: sanitizedName,
  })

  if (!validation.success) {
    throw new Error('Validation failed')
  }

  const { error, data } = await supabase
    .from('locations')
    .insert({ id: locationId, name: sanitizedName })
    .select('id, name')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/locations')
  return data as { id: string; name: string }
}

export async function createLocation(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const locationId = randomUUID()

  const name = getName(formData, 'name')
  const summary = getDescription(formData, 'summary')
  const description = getDescription(formData, 'description')
  const primaryCampaignId = getStringOrNull(formData, 'primary_campaign_id')
  const markerFile = formData.get('map_marker_icon') instanceof File ? (formData.get('map_marker_icon') as File) : null

  if (!validateName(name)) {
    throw new Error('Invalid location name. Provide a name between 1-100 characters without dangerous content.')
  }

  if (summary && !validateDescription(summary)) {
    throw new Error('Invalid summary. Summaries must be 2,000 characters or less.')
  }

  if (description && !validateDescription(description)) {
    throw new Error('Invalid description. Descriptions must be 2,000 characters or less.')
  }

  await assertUniqueValue(supabase, {
    table: 'locations',
    column: 'name',
    value: name,
    errorMessage: 'A location with this name already exists.',
  })

  let markerUrl: string | null = null
  if (markerFile) {
    const { url, error } = await uploadImage(LOCATION_BUCKET, markerFile, `locations/${locationId}/marker`)
    if (error) {
      throw new Error(`Failed to upload marker: ${error.message}`)
    }
    markerUrl = url
  }

  const payload = {
    name,
    summary: summary || null,
    description: description || null,
    primary_campaign_id: primaryCampaignId,
    map_marker_icon: markerUrl,
  }

  const validation = locationSchema.safeParse(payload)
  if (!validation.success) {
    if (markerUrl) {
      const path = getStoragePathFromUrl(LOCATION_BUCKET, markerUrl)
      if (path) {
        await deleteImage(LOCATION_BUCKET, path)
      }
    }
    throw new Error('Validation failed')
  }

  const { error } = await supabase.from('locations').insert({ id: locationId, ...validation.data })
  if (error) {
    if (markerUrl) {
      const path = getStoragePathFromUrl(LOCATION_BUCKET, markerUrl)
      if (path) {
        await deleteImage(LOCATION_BUCKET, path)
      }
    }
    throw new Error(error.message)
  }

  const campaignIds = getIdList(formData, 'campaign_ids')
  const sessionIds = getIdList(formData, 'session_ids')
  const groupIds = getIdList(formData, 'group_ids')
  const characterIds = getIdList(formData, 'character_ids')

  const touchedCampaigns = await syncJoinTable(supabase, 'location_campaigns', locationId, 'campaign_id', campaignIds)
  const touchedSessions = await syncJoinTable(supabase, 'location_sessions', locationId, 'session_id', sessionIds)
  const touchedGroups = await syncJoinTable(supabase, 'location_groups', locationId, 'group_id', groupIds)
  const touchedCharacters = await syncJoinTable(supabase, 'location_characters', locationId, 'character_id', characterIds)

  revalidateForLocation(locationId, {
    campaigns: touchedCampaigns.inserted.concat(touchedCampaigns.removed),
    sessions: touchedSessions.inserted.concat(touchedSessions.removed),
    groups: touchedGroups.inserted.concat(touchedGroups.removed),
    characters: touchedCharacters.inserted.concat(touchedCharacters.removed),
  })

  redirect(`/locations/${locationId}`)
}

export async function updateLocation(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()
  const name = getName(formData, 'name')
  const summary = getDescription(formData, 'summary')
  const description = getDescription(formData, 'description')
  const primaryCampaignId = getStringOrNull(formData, 'primary_campaign_id')
  const markerFile = formData.get('map_marker_icon') instanceof File ? (formData.get('map_marker_icon') as File) : null
  const removeMarker = getString(formData, 'map_marker_icon_remove') === 'true'

  if (!validateName(name)) {
    throw new Error('Invalid location name. Provide a name between 1-100 characters without dangerous content.')
  }

  if (summary && !validateDescription(summary)) {
    throw new Error('Invalid summary. Summaries must be 2,000 characters or less.')
  }

  if (description && !validateDescription(description)) {
    throw new Error('Invalid description. Descriptions must be 2,000 characters or less.')
  }

  await assertUniqueValue(supabase, {
    table: 'locations',
    column: 'name',
    value: name,
    excludeId: id,
    errorMessage: 'A location with this name already exists.',
  })

  const { data: existing, error: fetchError } = await supabase
    .from('locations')
    .select('map_marker_icon')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    throw new Error('Location not found')
  }

  let markerUrl = existing.map_marker_icon as string | null
  if (markerFile) {
    const { url, path, error } = await uploadImage(LOCATION_BUCKET, markerFile, `locations/${id}/marker`)
    if (error) {
      throw new Error(`Failed to upload marker: ${error.message}`)
    }

    const previousPath = getStoragePathFromUrl(LOCATION_BUCKET, markerUrl)
    if (previousPath && previousPath !== path) {
      await deleteImage(LOCATION_BUCKET, previousPath)
    }

    markerUrl = url
  } else if (removeMarker && markerUrl) {
    const path = getStoragePathFromUrl(LOCATION_BUCKET, markerUrl)
    if (path) {
      await deleteImage(LOCATION_BUCKET, path)
    }
    markerUrl = null
  }

  const payload = {
    name,
    summary: summary || null,
    description: description || null,
    primary_campaign_id: primaryCampaignId,
    map_marker_icon: markerUrl,
  }

  const validation = locationSchema.safeParse(payload)
  if (!validation.success) {
    throw new Error('Validation failed')
  }

  const { error } = await supabase
    .from('locations')
    .update(validation.data)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  const campaignIds = getIdList(formData, 'campaign_ids')
  const sessionIds = getIdList(formData, 'session_ids')
  const groupIds = getIdList(formData, 'group_ids')
  const characterIds = getIdList(formData, 'character_ids')

  const touchedCampaigns = await syncJoinTable(supabase, 'location_campaigns', id, 'campaign_id', campaignIds)
  const touchedSessions = await syncJoinTable(supabase, 'location_sessions', id, 'session_id', sessionIds)
  const touchedGroups = await syncJoinTable(supabase, 'location_groups', id, 'group_id', groupIds)
  const touchedCharacters = await syncJoinTable(supabase, 'location_characters', id, 'character_id', characterIds)

  revalidateForLocation(id, {
    campaigns: touchedCampaigns.inserted.concat(touchedCampaigns.removed),
    sessions: touchedSessions.inserted.concat(touchedSessions.removed),
    groups: touchedGroups.inserted.concat(touchedGroups.removed),
    characters: touchedCharacters.inserted.concat(touchedCharacters.removed),
  })

  redirect(`/locations/${id}`)
}

export async function deleteLocation(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('locations')
    .select('map_marker_icon')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('locations').delete().eq('id', id)
  if (error) {
    throw new Error(error.message)
  }

  if (existing?.map_marker_icon) {
    const path = getStoragePathFromUrl(LOCATION_BUCKET, existing.map_marker_icon)
    if (path) {
      await deleteImage(LOCATION_BUCKET, path)
    }
  }

  revalidatePath('/locations')
  redirect('/locations')
}
