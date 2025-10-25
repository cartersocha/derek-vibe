import { NextRequest, NextResponse } from 'next/server'
import { getDashboardData } from '@/lib/dashboard-data'
import { setCacheHeaders } from '@/lib/edge-cache'

// Edge runtime for better performance
export const runtime = 'edge'
export const revalidate = 300 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const data = await getDashboardData()
    
    const response = NextResponse.json(data)
    
    // Set edge caching headers
    return setCacheHeaders(response, 'dashboard', {
      'Content-Type': 'application/json',
      'X-Cache-Status': 'HIT'
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
