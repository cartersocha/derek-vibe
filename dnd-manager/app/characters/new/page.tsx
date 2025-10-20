import { createClient } from '@/lib/supabase/server'
import { NewCharacterForm } from '@/components/forms/new-character-form'
import { mapEntitiesToMentionTargets, mergeMentionTargets } from '@/lib/mention-utils'

type NewCharacterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function NewCharacterPage({ searchParams }: NewCharacterPageProps) {
  const supabase = await createClient()
  const params = await searchParams

  const [{ data: allCharacters }, { data: allSessions }, { data: organizations }] = await Promise.all([
    supabase.from('characters').select('id, name').order('name'),
    supabase.from('sessions').select('id, name').order('name'),
    supabase.from('organizations').select('id, name').order('name'),
  ])

  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(allCharacters, 'character', (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(allSessions, 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(organizations, 'organization', (entry) => `/organizations/${entry.id}`)
  )

  const redirectValue = params?.redirectTo
  const redirectTo = Array.isArray(redirectValue) ? redirectValue[0] ?? null : redirectValue ?? null

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="retro-title text-3xl font-bold text-[#00ffff]">Create New Character</h1>
      </div>

      <NewCharacterForm
        redirectTo={redirectTo}
        mentionTargets={mentionTargets}
        organizations={(organizations ?? []).map((organization) => ({
          id: organization.id,
          name: organization.name ?? 'Untitled Organization',
        }))}
      />
    </div>
  )
}
