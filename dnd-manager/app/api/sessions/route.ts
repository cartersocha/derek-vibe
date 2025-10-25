import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { setCacheHeaders } from '@/lib/edge-cache'

// Edge runtime for fast API responses
export const runtime = 'edge'
export const revalidate = 180 // 3 minutes
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: sessions } = await supabase
      .from('sessions')
      .select(`
        id,
        name,
        session_date,
        created_at,
        campaign_id,
        campaign:campaigns(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(20)
    
    const response = NextResponse.json(sessions || [])
    
    // Set edge caching headers
    return setCacheHeaders(response, 'api', {
      'Content-Type': 'application/json',
      'X-Cache-Status': 'HIT'
    })
  } catch (error) {
    console.error('Sessions API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
