import { createClient } from '@/lib/supabase/server'
import { CampaignsIndex } from '@/components/ui/campaigns-index'

export default async function CampaignsPage() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  return <CampaignsIndex campaigns={campaigns ?? []} />
}
