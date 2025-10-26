import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'

// Node.js runtime for cache invalidation
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tag, path } = body

    if (tag) {
      // Revalidate by tag
      revalidateTag(tag)
      return NextResponse.json({ 
        revalidated: true, 
        tag,
        now: Date.now() 
      })
    }

    if (path) {
      // Revalidate by path
      revalidatePath(path)
      return NextResponse.json({ 
        revalidated: true, 
        path,
        now: Date.now() 
      })
    }

    return NextResponse.json({ 
      error: 'Missing tag or path parameter' 
    }, { status: 400 })

  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to revalidate cache' },
      { status: 500 }
    )
  }
}
