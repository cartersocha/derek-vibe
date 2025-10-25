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
export function invalidateEdgeCache(tags: string[]) {
  // This would integrate with your edge provider's invalidation API
  console.log('Invalidating edge cache for tags:', tags)
  // Implementation depends on your edge provider (Vercel, Cloudflare, etc.)
}
