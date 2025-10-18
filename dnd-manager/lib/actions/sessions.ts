'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteImage, getStoragePathFromUrl, uploadImage } from '@/lib/supabase/storage'
import { sessionSchema } from '@/lib/validations/schemas'
import { sanitizeNullableText, sanitizeText } from '@/lib/security/sanitize'
import { toTitleCase } from '@/lib/utils'
import {
  getCampaignOrganizationIds,
  resolveOrganizationIds,
  setSessionOrganizations,
} from '@/lib/actions/organizations'
import { extractOrganizationIds } from '@/lib/organizations/helpers'

const SESSION_BUCKET = 'session-images' as const

export async function createSession(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const sessionId = randomUUID()

  const organizationFieldProvided =
    formData.has('organization_ids') || formData.has('organization_id')
  const directOrganizationIds = extractOrganizationIds(formData)

  const headerImageFile = getFile(formData, 'header_image')

  const sessionName = toTitleCase(getString(formData, 'name'))

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
    const sessionCharacters = characterIds.map(characterId => ({
      session_id: sessionId,
      character_id: characterId,
    }))

    await supabase.from('session_characters').insert(sessionCharacters)
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
    await setSessionOrganizations(supabase, sessionId, finalOrganizationIds)
    revalidatePath('/organizations')
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

  const sessionName = toTitleCase(getString(formData, 'name'))

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

  const characterIds = formData.getAll('character_ids') as string[]

  await supabase.from('session_characters').delete().eq('session_id', id)

  if (characterIds.length > 0) {
    const sessionCharacters = characterIds.map(characterId => ({
      session_id: id,
      character_id: characterId,
    }))

    await supabase.from('session_characters').insert(sessionCharacters)
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

  await setSessionOrganizations(supabase, id, finalOrganizationIds)
  revalidatePath('/organizations')

  revalidatePath('/sessions')
  revalidatePath(`/sessions/${id}`)
  redirect(`/sessions/${id}`)
}

export async function deleteSession(id: string): Promise<void> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('sessions')
    .select('header_image_url')
    .eq('id', id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(fetchError.message)
  }

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

  revalidatePath('/sessions')
  redirect('/sessions')
}

function getString(formData: FormData, key: string): string {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return ''
  }

  return sanitizeText(value).trim()
}

function getStringOrNull(formData: FormData, key: string): string | null {
  const value = formData.get(key)

  return sanitizeNullableText(value)
}

function getFile(formData: FormData, key: string): File | null {
  const value = formData.get(key)

  if (value instanceof File && value.size > 0) {
    return value
  }

  return null
}
