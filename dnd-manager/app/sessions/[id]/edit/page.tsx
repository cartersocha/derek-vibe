import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateSession } from '@/lib/actions/sessions'
import SessionForm from '@/components/forms/session-form'

export default async function SessionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('sessions')
    .select(`
      *,
      campaign:campaigns(id, name)
    `)
    .eq('id', id)
    .single()

  if (!session) {
    notFound()
  }

  // Fetch characters for this session
  const { data: sessionCharacters } = await supabase
    .from('session_characters')
    .select('character_id')
    .eq('session_id', id)

  const characterIds = sessionCharacters?.map(sc => sc.character_id) || []

  // Fetch all campaigns and characters for the form
  const [{ data: campaigns }, { data: allCharacters }] = await Promise.all([
    supabase.from('campaigns').select('id, name').order('name'),
    supabase.from('characters').select('id, name, race, class').order('name'),
  ])

  const updateSessionWithId = updateSession.bind(null, id)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <Link href={`/sessions/${id}`} className="text-[#00ffff] hover:text-[#ff00ff] font-mono uppercase tracking-wider">
          ← Back to Session
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-[#00ffff] uppercase tracking-wider">Edit Session</h2>
      
      <SessionForm
        action={updateSessionWithId}
        initialData={{
          name: session.name,
          campaign_id: session.campaign_id,
          session_date: session.session_date,
          notes: session.notes,
          header_image_url: session.header_image_url,
          characterIds: characterIds
        }}
        campaigns={campaigns || []}
        characters={allCharacters || []}
        submitLabel="Save Changes"
        cancelHref={`/sessions/${id}`}
      />
    </div>
  )
}
