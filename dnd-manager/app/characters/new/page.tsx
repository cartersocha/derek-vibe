import { createClient } from '@/lib/supabase/server'
import { NewCharacterForm } from '@/components/forms/new-character-form'

type NewCharacterPageProps = {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function NewCharacterPage({ searchParams }: NewCharacterPageProps) {
  const supabase = await createClient()

  const [{ data: allCharacters }, { data: allSessions }] = await Promise.all([
    supabase.from('characters').select('id, name').order('name'),
    supabase.from('sessions').select('id, name').order('name'),
  ])

  const mentionTargets = [
    ...(allCharacters ?? [])
      .filter((entry): entry is { id: string; name: string } => Boolean(entry?.name))
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        href: `/characters/${entry.id}`,
        kind: 'character' as const,
      })),
    ...(allSessions ?? [])
      .filter((entry): entry is { id: string; name: string } => Boolean(entry?.name))
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        href: `/sessions/${entry.id}`,
        kind: 'session' as const,
      })),
  ].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

  const redirectValue = searchParams?.redirectTo
  const redirectTo = Array.isArray(redirectValue) ? redirectValue[0] ?? null : redirectValue ?? null

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#00ffff] uppercase tracking-wider">Create New Character</h1>
        <p className="mt-2 text-gray-400 font-mono">Add a new character to your campaign</p>
      </div>

      <NewCharacterForm redirectTo={redirectTo} mentionTargets={mentionTargets} />
    </div>
  )
}

