"use server"

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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

  const data = {
    name: sanitizeText(name).trim(),
    description: sanitizeNullableText(description ?? null),
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

  const organizationFieldProvided =
    formData.has('organization_ids') || formData.has('organization_id')
  const discoveredOrganizationIds = extractOrganizationIds(formData)

  const rawName = formData.get('name')
  const data = {
    name: typeof rawName === 'string' ? sanitizeText(rawName).trim() : '',
    description: sanitizeNullableText(formData.get('description')),
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

  const { error } = await supabase
    .from('campaigns')
    .insert({ id: campaignId, ...result.data })

  if (error) {
    throw new Error(error.message)
  }

  let resolvedOrganizationIds = Array.from(new Set(discoveredOrganizationIds))

  if (resolvedOrganizationIds.length === 0 && !organizationFieldProvided) {
    resolvedOrganizationIds = await resolveOrganizationIds(supabase, [])
  }

  if (resolvedOrganizationIds.length > 0 || organizationFieldProvided) {
    await setCampaignOrganizations(supabase, campaignId, resolvedOrganizationIds)
  }

  if (resolvedOrganizationIds.length > 0) {
    revalidatePath('/organizations')
  }

  revalidatePath('/campaigns')
  redirect('/campaigns')
}

export async function updateCampaign(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()

  const organizationFieldProvided =
    formData.has('organization_ids') || formData.has('organization_id')
  const discoveredOrganizationIds = extractOrganizationIds(formData)

  const rawName = formData.get('name')
  const data = {
    name: typeof rawName === 'string' ? sanitizeText(rawName).trim() : '',
    description: sanitizeNullableText(formData.get('description')),
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

  const { error } = await supabase
    .from('campaigns')
    .update(result.data)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  if (organizationFieldProvided) {
    const resolvedOrganizationIds = Array.from(new Set(discoveredOrganizationIds))
    await setCampaignOrganizations(supabase, id, resolvedOrganizationIds)
    revalidatePath('/organizations')
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
