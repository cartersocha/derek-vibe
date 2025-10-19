import { createClient } from '@/lib/supabase/server'
import { NewCharacterForm } from '@/components/forms/new-character-form'

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

  const mentionTargets = [
    ...(allCharacters ?? [])
      .flatMap((entry) => {
        if (!entry?.id || !entry?.name) {
          return []
        }
        return [{
          id: entry.id as string,
          name: entry.name as string,
          href: `/characters/${entry.id}`,
          kind: 'character' as const,
        }]
      }),
    ...(allSessions ?? [])
      .flatMap((entry) => {
        if (!entry?.id || !entry?.name) {
          return []
        }
        return [{
          id: entry.id as string,
          name: entry.name as string,
          href: `/sessions/${entry.id}`,
          kind: 'session' as const,
        }]
      }),
    ...(organizations ?? [])
      .flatMap((entry) => {
        if (!entry?.id || !entry?.name) {
          return []
        }
        return [{
          id: entry.id as string,
          name: entry.name as string,
          href: `/organizations/${entry.id}`,
          kind: 'organization' as const,
        }]
      }),
  ].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

  const redirectValue = params?.redirectTo
  const redirectTo = Array.isArray(redirectValue) ? redirectValue[0] ?? null : redirectValue ?? null

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#00ffff] uppercase tracking-wider">Create New Character</h1>
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
