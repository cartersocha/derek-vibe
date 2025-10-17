import { createClient } from './server'

export async function uploadImage(
  bucket: 'character-images' | 'session-images',
  file: File,
  path: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
      })

    if (error) {
      return { url: null, error }
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return { url: publicUrl, error: null }
  } catch (error) {
    return { url: null, error: error as Error }
  }
}

export async function deleteImage(
  bucket: 'character-images' | 'session-images',
  path: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    return { error }
  } catch (error) {
    return { error: error as Error }
  }
}
