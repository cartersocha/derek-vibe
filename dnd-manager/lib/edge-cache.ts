import { NextRequest, NextResponse } from 'next/server'

// Edge caching configuration
export const CACHE_CONFIG = {
  // Static assets - cache for 1 year
  static: {
    maxAge: 31536000, // 1 year
    sMaxAge: 31536000,
    staleWhileRevalidate: 86400, // 1 day
  },
  
  // API responses - cache for 5 minutes
  api: {
    maxAge: 300, // 5 minutes
    sMaxAge: 300,
    staleWhileRevalidate: 60, // 1 minute
  },
  
  // Dashboard data - cache for 2 minutes
  dashboard: {
    maxAge: 120, // 2 minutes
    sMaxAge: 120,
    staleWhileRevalidate: 30, // 30 seconds
  },
  
  // Login page - cache for 1 hour
  login: {
    maxAge: 3600, // 1 hour
    sMaxAge: 3600,
    staleWhileRevalidate: 300, // 5 minutes
  }
}

export function setCacheHeaders(
  response: NextResponse,
  cacheType: keyof typeof CACHE_CONFIG,
  customHeaders?: Record<string, string>
) {
  const config = CACHE_CONFIG[cacheType]
  
  // Set cache control headers
  response.headers.set(
    'Cache-Control',
    `public, max-age=${config.maxAge}, s-maxage=${config.sMaxAge}, stale-while-revalidate=${config.staleWhileRevalidate}`
  )
  
  // Set Vercel-specific headers
  response.headers.set('Vercel-CDN-Cache-Control', `max-age=${config.sMaxAge}`)
  response.headers.set('Vercel-Cache-Control', `max-age=${config.maxAge}`)
  
  // Add custom headers
  if (customHeaders) {
    Object.entries(customHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }
  
  return response
}

// Edge caching middleware for API routes
export function withEdgeCache(
  handler: (request: NextRequest) => Promise<NextResponse>,
  cacheType: keyof typeof CACHE_CONFIG = 'api'
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request)
    return setCacheHeaders(response, cacheType)
  }
}

// Cache key generation for different data types
export function generateCacheKey(
  baseKey: string,
  params: Record<string, string | number> = {}
): string {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|')
  
  return sortedParams ? `${baseKey}|${sortedParams}` : baseKey
}

// Edge cache invalidation
export async function invalidateEdgeCache(tags: string[]) {
  try {
    // Call the revalidation API
    const response = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tag: tags[0] })
    })
    
    if (!response.ok) {
      throw new Error('Failed to invalidate cache')
    }
    
    console.log('Successfully invalidated edge cache for tags:', tags)
    return true
  } catch (error) {
    console.error('Cache invalidation error:', error)
    return false
  }
}

// Cache warming for critical data
export async function warmCache() {
  try {
    // Pre-warm critical API endpoints
    const endpoints = [
      '/api/dashboard',
      '/api/sessions',
      '/api/characters'
    ]
    
    await Promise.all(
      endpoints.map(endpoint => 
        fetch(endpoint, { 
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        })
      )
    )
    
    console.log('Cache warmed successfully')
    return true
  } catch (error) {
    console.error('Cache warming error:', error)
    return false
  }
}
