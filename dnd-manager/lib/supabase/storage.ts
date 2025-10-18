import { put, del } from '@vercel/blob'

type StorageBucket = 'character-images' | 'session-images'

export async function uploadImage(
  bucket: StorageBucket,
  file: File,
  path: string
): Promise<{ url: string | null; path: string | null; error: Error | null }> {
  try {
    const pathname = `${bucket}/${path}`
    
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    return { url: blob.url, path: pathname, error: null }
  } catch (error) {
    return { url: null, path: null, error: error as Error }
  }
}

export async function deleteImage(
  bucket: StorageBucket,
  path: string | null
): Promise<{ error: Error | null }> {
  try {
    if (!path) {
      return { error: null }
    }

    await del(path)

    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

export function getStoragePathFromUrl(
  bucket: StorageBucket,
  url: string | null
): string | null {
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)
    
    // Vercel Blob URLs look like: https://[hash].public.blob.vercel-storage.com/[path]
    const pathname = parsed.pathname
    
    // Remove leading slash and return the path
    return pathname.startsWith('/') ? pathname.slice(1) : pathname
  } catch {
    return null
  }
}
