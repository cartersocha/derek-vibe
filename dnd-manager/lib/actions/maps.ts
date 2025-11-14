"use server";

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { uploadImage, deleteImage, getStoragePathFromUrl } from '@/lib/supabase/storage'
import { STORAGE_BUCKETS } from '@/lib/utils/storage'
import { mapSchema, mapPinSchema } from '@/lib/validations/location'
import { getString, getStringOrNull, getIdList } from '@/lib/utils/form-data'

const MAP_BUCKET = STORAGE_BUCKETS.LOCATION_MAPS

async function syncCampaignMaps(supabase: SupabaseClient, mapId: string, campaignIds: string[]) {
  const desiredIds = Array.from(new Set(campaignIds.filter(Boolean)))

  const { data: existingAssigned } = await supabase
    .from('campaigns')
    .select('id')
    .eq('map_id', mapId)

  const existingIds = (existingAssigned ?? []).map((entry) => entry.id as string)
  const toDetach = existingIds.filter((id) => !desiredIds.includes(id))

  if (toDetach.length > 0) {
    await supabase
      .from('campaigns')
      .update({ map_id: null })
      .in('id', toDetach)
  }

  if (desiredIds.length > 0) {
    await supabase
      .from('campaigns')
      .update({ map_id: mapId })
      .in('id', desiredIds)
  }

  revalidatePath('/campaigns')
  desiredIds.concat(toDetach).forEach((id) => {
    revalidatePath(`/campaigns/${id}`)
  })
}

export async function createMap(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const mapId = randomUUID()

  const name = getString(formData, 'name')
  const description = getStringOrNull(formData, 'description')
  const naturalWidthRaw = getString(formData, 'natural_width')
  const naturalHeightRaw = getString(formData, 'natural_height')
  const campaignIds = getIdList(formData, 'campaign_ids')

  const file = formData.get('image')
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('Map image is required.')
  }

  const { url, error, path } = await uploadImage(MAP_BUCKET, file, `maps/${mapId}/image`)
  if (error) {
    throw new Error(`Failed to upload map image: ${error.message}`)
  }

  const naturalWidth = Number.parseInt(naturalWidthRaw, 10)
  const naturalHeight = Number.parseInt(naturalHeightRaw, 10)

  const payload = {
    name,
    description,
    image_url: url,
    natural_width: Number.isNaN(naturalWidth) ? null : naturalWidth,
    natural_height: Number.isNaN(naturalHeight) ? null : naturalHeight,
  }

  const validation = mapSchema.safeParse(payload)
  if (!validation.success) {
    if (path) {
      await deleteImage(MAP_BUCKET, path)
    }
    throw new Error('Validation failed')
  }

  const { error: insertError } = await supabase.from('maps').insert({ id: mapId, ...validation.data })
  if (insertError) {
    if (path) {
      await deleteImage(MAP_BUCKET, path)
    }
    throw new Error(insertError.message)
  }

  await syncCampaignMaps(supabase, mapId, campaignIds)

  revalidatePath('/maps')
  redirect('/maps')
}

export async function updateMap(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('maps')
    .select('image_url')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    throw new Error('Map not found')
  }

  const name = getString(formData, 'name')
  const description = getStringOrNull(formData, 'description')
  const naturalWidthRaw = getString(formData, 'natural_width')
  const naturalHeightRaw = getString(formData, 'natural_height')
  const campaignIds = getIdList(formData, 'campaign_ids')
  const imageFile = formData.get('image') instanceof File ? (formData.get('image') as File) : null
  const removeImage = getString(formData, 'remove_image') === 'true'

  let imageUrl = existing.image_url as string
  if (imageFile) {
    const { url, path, error } = await uploadImage(MAP_BUCKET, imageFile, `maps/${id}/image`)
    if (error) {
      throw new Error(`Failed to upload map image: ${error.message}`)
    }

    const previousPath = getStoragePathFromUrl(MAP_BUCKET, imageUrl)
    if (previousPath && previousPath !== path) {
      await deleteImage(MAP_BUCKET, previousPath)
    }

    imageUrl = url
  } else if (removeImage) {
    const previousPath = getStoragePathFromUrl(MAP_BUCKET, imageUrl)
    if (previousPath) {
      await deleteImage(MAP_BUCKET, previousPath)
    }
    imageUrl = ''
  }

  if (!imageUrl) {
    throw new Error('Map image is required.')
  }

  const naturalWidth = Number.parseInt(naturalWidthRaw, 10)
  const naturalHeight = Number.parseInt(naturalHeightRaw, 10)

  const payload = {
    name,
    description,
    image_url: imageUrl,
    natural_width: Number.isNaN(naturalWidth) ? null : naturalWidth,
    natural_height: Number.isNaN(naturalHeight) ? null : naturalHeight,
  }

  const validation = mapSchema.safeParse(payload)
  if (!validation.success) {
    throw new Error('Validation failed')
  }

  const { error } = await supabase
    .from('maps')
    .update(validation.data)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  await syncCampaignMaps(supabase, id, campaignIds)

  revalidatePath('/maps')
  revalidatePath(`/maps/${id}`)
}

export async function deleteMap(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('maps')
    .select('image_url')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('maps').delete().eq('id', id)
  if (error) {
    throw new Error(error.message)
  }

  if (existing?.image_url) {
    const path = getStoragePathFromUrl(MAP_BUCKET, existing.image_url)
    if (path) {
      await deleteImage(MAP_BUCKET, path)
    }
  }

  await syncCampaignMaps(supabase, id, [])

  revalidatePath('/maps')
  redirect('/maps')
}

export async function createMapPin(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const mapId = getString(formData, 'map_id')
  const locationId = getString(formData, 'location_id')
  const xPercent = Number.parseFloat(getString(formData, 'x_percent'))
  const yPercent = Number.parseFloat(getString(formData, 'y_percent'))
  const label = getStringOrNull(formData, 'label')

  const payload = {
    map_id: mapId,
    location_id: locationId,
    x_percent: xPercent,
    y_percent: yPercent,
    label,
  }

  const validation = mapPinSchema.safeParse(payload)
  if (!validation.success) {
    throw new Error('Validation failed')
  }

  const { error } = await supabase.from('map_pins').insert({ id: randomUUID(), ...validation.data })
  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/maps')
  revalidatePath(`/maps/${mapId}`)
  revalidatePath(`/locations/${locationId}`)
}

export async function updateMapPin(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()
  const mapId = getString(formData, 'map_id')
  const locationId = getString(formData, 'location_id')
  const xPercent = Number.parseFloat(getString(formData, 'x_percent'))
  const yPercent = Number.parseFloat(getString(formData, 'y_percent'))
  const label = getStringOrNull(formData, 'label')

  const payload = {
    map_id: mapId,
    location_id: locationId,
    x_percent: xPercent,
    y_percent: yPercent,
    label,
  }

  const validation = mapPinSchema.safeParse(payload)
  if (!validation.success) {
    throw new Error('Validation failed')
  }

  const { error } = await supabase
    .from('map_pins')
    .update(validation.data)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/maps')
  revalidatePath(`/maps/${mapId}`)
  revalidatePath(`/locations/${locationId}`)
}

export async function deleteMapPin(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('map_pins')
    .select('map_id, location_id')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('map_pins').delete().eq('id', id)
  if (error) {
    throw new Error(error.message)
  }

  if (existing) {
    revalidatePath('/maps')
    if (existing.map_id) {
      revalidatePath(`/maps/${existing.map_id}`)
    }
    if (existing.location_id) {
      revalidatePath(`/locations/${existing.location_id}`)
    }
  }
}
