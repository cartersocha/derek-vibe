import { createClient } from '@/lib/supabase/server'

export default async function TestDbPage() {
  const supabase = await createClient()
  
  // Test basic database access
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id, name, session_date, created_at')
    .limit(5)
    
  const { data: characters, error: charactersError } = await supabase
    .from('characters')
    .select('id, name, created_at')
    .limit(5)
    
  const { data: sessionCharacters, error: sessionCharsError } = await supabase
    .from('session_characters')
    .select('session_id, character_id')
    .limit(5)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Sessions</h2>
          <p>Error: {sessionsError?.message || 'None'}</p>
          <p>Count: {sessions?.length || 0}</p>
          <pre className="bg-[var(--gray-100)] p-2 rounded text-sm">
            {JSON.stringify(sessions, null, 2)}
          </pre>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold">Characters</h2>
          <p>Error: {charactersError?.message || 'None'}</p>
          <p>Count: {characters?.length || 0}</p>
          <pre className="bg-[var(--gray-100)] p-2 rounded text-sm">
            {JSON.stringify(characters, null, 2)}
          </pre>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold">Session Characters</h2>
          <p>Error: {sessionCharsError?.message || 'None'}</p>
          <p>Count: {sessionCharacters?.length || 0}</p>
          <pre className="bg-[var(--gray-100)] p-2 rounded text-sm">
            {JSON.stringify(sessionCharacters, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
