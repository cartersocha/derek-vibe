"use server";

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from '@/lib/supabase/server'
import { assertUniqueValue } from '@/lib/supabase/ensure-unique'
import { deleteImage, getStoragePathFromUrl, uploadImage } from '@/lib/supabase/storage'
import { sessionSchema } from '@/lib/validations/schemas'
import { getString, getStringOrNull, getFile, getIdList, getDateValue } from '@/lib/utils/form-data'
import { STORAGE_BUCKETS } from '@/lib/utils/storage'
import { sanitizeNullableText, sanitizeText } from '@/lib/security/sanitize'
import { toTitleCase } from '@/lib/utils'
import {
  getCampaignOrganizationIds,
  resolveOrganizationIds,
  setSessionOrganizations,
} from '@/lib/actions/organizations'
import { extractOrganizationIds } from '@/lib/organizations/helpers'

// List sessions with pagination
export async function getSessionsList(supabase: SupabaseClient, { limit = 20, offset = 0 } = {}): Promise<any[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return data ?? [];
}

const SESSION_BUCKET = STORAGE_BUCKETS.SESSIONS

export async function createSessionInline(name: string, campaignId?: string | null): Promise<{ id: string; name: string }> {
  const supabase = await createClient()
  const sanitized = sanitizeText(name).trim()

  if (!sanitized) {
    throw new Error('Session name is required')
  }

  const normalizedName = toTitleCase(sanitized)
  await assertUniqueValue(supabase, {
    table: 'sessions',
    column: 'name',
    value: normalizedName,
    errorMessage: 'Session name already exists. Choose a different name.',
  })

  const sessionId = randomUUID()

  const { error } = await supabase
    .from('sessions')
    .insert({
      id: sessionId,
      name: normalizedName,
      campaign_id: campaignId ?? null,
    })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/sessions')
  revalidatePath('/campaigns')

  if (campaignId) {
    revalidatePath(`/campaigns/${campaignId}`)
  }

  return { id: sessionId, name: normalizedName }
}

export async function createSession(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const sessionId = randomUUID()

  const organizationFieldProvided =
    formData.has('organization_ids') || formData.has('organization_id')
  const directOrganizationIds = extractOrganizationIds(formData)

  const headerImageFile = getFile(formData, 'header_image')

  const sessionName = toTitleCase(getString(formData, 'name'))

  await assertUniqueValue(supabase, {
    table: 'sessions',
    column: 'name',
    value: sessionName,
    errorMessage: 'Session name already exists. Choose a different name.',
  })

  const baseData = {
    name: sessionName,
    campaign_id: getStringOrNull(formData, 'campaign_id'),
    session_date: getStringOrNull(formData, 'session_date'),
    notes: getStringOrNull(formData, 'notes'),
    header_image_url: null as string | null,
  }

  const result = sessionSchema.safeParse(baseData)
  if (!result.success) {
    throw new Error('Validation failed')
  }

  let headerImageUrl: string | null = null

  if (headerImageFile) {
    const { url, error: uploadError } = await uploadImage(
      SESSION_BUCKET,
      headerImageFile,
      `sessions/${sessionId}`
    )

    if (uploadError) {
      throw new Error(`Failed to upload session image: ${uploadError.message}`)
    }

    headerImageUrl = url
  }

  const { error } = await supabase
    .from('sessions')
    .insert({ id: sessionId, ...result.data, header_image_url: headerImageUrl })

  if (error) {
    if (headerImageUrl) {
      const path = getStoragePathFromUrl(SESSION_BUCKET, headerImageUrl)
      await deleteImage(SESSION_BUCKET, path)
    }
    throw new Error(error.message)
  }

  const characterIds = formData.getAll('character_ids') as string[]
  if (characterIds.length > 0) {
    const sessionCharacters = characterIds.map((characterId) => ({
      session_id: sessionId,
      character_id: characterId,
    }))

    await supabase.from('session_characters').insert(sessionCharacters)

    const uniqueCharacterIds = Array.from(new Set(characterIds)).filter(Boolean)
    if (uniqueCharacterIds.length > 0) {
      revalidatePath('/characters')
      uniqueCharacterIds.forEach((characterId) => {
        revalidatePath(`/characters/${characterId}`)
      })
    }
  }

  let preferredOrganizationIds = Array.from(new Set(directOrganizationIds))

  if (preferredOrganizationIds.length === 0 && !organizationFieldProvided) {
    preferredOrganizationIds = await resolveOrganizationIds(supabase, [])
  }

  const campaignOrganizationIds = await getCampaignOrganizationIds(
    supabase,
    result.data.campaign_id ?? null
  )

  const finalOrganizationIds = Array.from(
    new Set([...preferredOrganizationIds, ...campaignOrganizationIds])
  )

  if (
    finalOrganizationIds.length > 0 ||
    organizationFieldProvided ||
    campaignOrganizationIds.length > 0
  ) {
    const touchedOrganizationIds = await setSessionOrganizations(
      supabase,
      sessionId,
      finalOrganizationIds
    )
    if (touchedOrganizationIds.length > 0) {
      revalidatePath('/organizations')
      Array.from(new Set(touchedOrganizationIds)).forEach((organizationId) => {
        if (organizationId) {
          revalidatePath(`/organizations/${organizationId}`)
        }
      })
    }
  }

  if (result.data.campaign_id) {
    revalidatePath('/campaigns')
    revalidatePath(`/campaigns/${result.data.campaign_id}`)
  }

  revalidatePath('/sessions')
  redirect('/sessions')
}

export async function updateSession(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('sessions')
    .select('header_image_url, campaign_id')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    throw new Error('Session not found')
  }

  const organizationFieldProvided =
    formData.has('organization_ids') || formData.has('organization_id')
  const directOrganizationIds = extractOrganizationIds(formData)

  const headerImageFile = getFile(formData, 'header_image')
  const removeHeader = formData.get('header_image_remove') === 'true'
  let headerImageUrl = existing.header_image_url

  const sessionName = toTitleCase(getString(formData, 'name'))

  await assertUniqueValue(supabase, {
    table: 'sessions',
    column: 'name',
    value: sessionName,
    excludeId: id,
    errorMessage: 'Session name already exists. Choose a different name.',
  })

  if (headerImageFile) {
    const { url, path, error: uploadError } = await uploadImage(
      SESSION_BUCKET,
      headerImageFile,
      `sessions/${id}`
    )

    if (uploadError) {
      throw new Error(`Failed to upload session image: ${uploadError.message}`)
    }

    const previousPath = getStoragePathFromUrl(SESSION_BUCKET, headerImageUrl)
    if (previousPath && previousPath !== path) {
      const { error: deletePreviousError } = await deleteImage(
        SESSION_BUCKET,
        previousPath
      )

      if (deletePreviousError) {
        console.error(
          'Failed to remove previous session image from storage',
          deletePreviousError
        )
      }
    }

    headerImageUrl = url
  } else if (removeHeader && headerImageUrl) {
    const path = getStoragePathFromUrl(SESSION_BUCKET, headerImageUrl)
    const { error: deleteError } = await deleteImage(SESSION_BUCKET, path)

    if (deleteError) {
      throw new Error(`Failed to delete session image: ${deleteError.message}`)
    }

    headerImageUrl = null
  }

  const data = {
    name: sessionName,
    campaign_id: getStringOrNull(formData, 'campaign_id'),
    session_date: getStringOrNull(formData, 'session_date'),
    notes: getStringOrNull(formData, 'notes'),
    header_image_url: headerImageUrl,
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

  const { data: existingSessionCharacters, error: existingCharactersError } = await supabase
    .from('session_characters')
    .select('character_id')
    .eq('session_id', id)

  if (existingCharactersError) {
    throw new Error(existingCharactersError.message)
  }

  const previousCharacterIds = new Set(
    (existingSessionCharacters ?? [])
      .map((entry) => entry?.character_id)
      .filter((value): value is string => Boolean(value))
  )

  const characterIds = formData.getAll('character_ids') as string[]
  const nextCharacterIds = new Set(characterIds.filter(Boolean))

  const touchedCharacterIds = new Set<string>()
  previousCharacterIds.forEach((characterId) => {
    if (!nextCharacterIds.has(characterId)) {
      touchedCharacterIds.add(characterId)
    }
  })
  nextCharacterIds.forEach((characterId) => {
    if (!previousCharacterIds.has(characterId)) {
      touchedCharacterIds.add(characterId)
    }
  })

  await supabase.from('session_characters').delete().eq('session_id', id)

  if (characterIds.length > 0) {
    const sessionCharacters = characterIds.map((characterId) => ({
      session_id: id,
      character_id: characterId,
    }))

    await supabase.from('session_characters').insert(sessionCharacters)
  }

  if (touchedCharacterIds.size > 0) {
    revalidatePath('/characters')
    touchedCharacterIds.forEach((characterId) => {
      revalidatePath(`/characters/${characterId}`)
    })
  }

  let preferredOrganizationIds: string[]

  if (organizationFieldProvided) {
    preferredOrganizationIds = Array.from(new Set(directOrganizationIds))
  } else {
    const { data: existingSessionOrganizations, error: existingOrgError } = await supabase
      .from('organization_sessions')
      .select('organization_id')
      .eq('session_id', id)

    if (existingOrgError) {
      throw new Error(existingOrgError.message)
    }

    preferredOrganizationIds = Array.from(
      new Set(existingSessionOrganizations?.map((row) => row.organization_id) ?? [])
    )

    if (preferredOrganizationIds.length === 0) {
      preferredOrganizationIds = await resolveOrganizationIds(supabase, [])
    }
  }

  const campaignOrganizationIds = await getCampaignOrganizationIds(
    supabase,
    result.data.campaign_id ?? null
  )

  const finalOrganizationIds = Array.from(
    new Set([...preferredOrganizationIds, ...campaignOrganizationIds])
  )

  const touchedOrganizationIds = await setSessionOrganizations(
    supabase,
    id,
    finalOrganizationIds
  )
  if (touchedOrganizationIds.length > 0) {
    revalidatePath('/organizations')
    Array.from(new Set(touchedOrganizationIds)).forEach((organizationId) => {
      if (organizationId) {
        revalidatePath(`/organizations/${organizationId}`)
      }
    })
  }

  const campaignIdsToRevalidate = new Set<string>()
  if (existing.campaign_id) {
    campaignIdsToRevalidate.add(existing.campaign_id)
  }
  if (result.data.campaign_id) {
    campaignIdsToRevalidate.add(result.data.campaign_id)
  }
  if (campaignIdsToRevalidate.size > 0) {
    revalidatePath('/campaigns')
    campaignIdsToRevalidate.forEach((campaignId) => {
      revalidatePath(`/campaigns/${campaignId}`)
    })
  }

  revalidatePath('/sessions')
  revalidatePath(`/sessions/${id}`)
  redirect(`/sessions/${id}`)
}

export async function deleteSession(id: string): Promise<void> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('sessions')
    .select('header_image_url, campaign_id')
    .eq('id', id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(fetchError.message)
  }

  const { data: linkedOrganizations, error: organizationError } = await supabase
    .from('organization_sessions')
    .select('organization_id')
    .eq('session_id', id)

  if (organizationError) {
    throw new Error(organizationError.message)
  }

  const { data: linkedCharacters, error: charactersError } = await supabase
    .from('session_characters')
    .select('character_id')
    .eq('session_id', id)

  if (charactersError) {
    throw new Error(charactersError.message)
  }

  const touchedOrganizationIds = Array.from(
    new Set(
      (linkedOrganizations ?? [])
        .map((entry) => entry?.organization_id)
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
    .from('sessions')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  if (existing?.header_image_url) {
    const path = getStoragePathFromUrl(SESSION_BUCKET, existing.header_image_url)
    const { error: deleteError } = await deleteImage(SESSION_BUCKET, path)

    if (deleteError) {
      console.error('Failed to remove session image from storage', deleteError)
    }
  }

  if (existing?.campaign_id) {
    revalidatePath('/campaigns')
    revalidatePath(`/campaigns/${existing.campaign_id}`)
  }

  if (touchedOrganizationIds.length > 0) {
    revalidatePath('/organizations')
    touchedOrganizationIds.forEach((organizationId) => {
      revalidatePath(`/organizations/${organizationId}`)
    })
  }

  if (touchedCharacterIds.length > 0) {
    revalidatePath('/characters')
    touchedCharacterIds.forEach((characterId) => {
      revalidatePath(`/characters/${characterId}`)
    })
  }

  revalidatePath('/sessions')
  redirect('/sessions')
}

