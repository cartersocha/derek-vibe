import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { setCacheHeaders } from '@/lib/edge-cache'

// Node.js runtime for API responses
export const runtime = 'nodejs'
export const revalidate = 240 // 4 minutes
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: characters } = await supabase
      .from('characters')
      .select(`
        id,
        name,
        class,
        race,
        level,
        player_type,
        status
      `)
      .order('name')
      .limit(50)
    
    const response = NextResponse.json(characters || [])
    
    // Set edge caching headers
    return setCacheHeaders(response, 'api', {
      'Content-Type': 'application/json',
      'X-Cache-Status': 'HIT'
    })
  } catch (error) {
    console.error('Characters API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    )
  }
}
