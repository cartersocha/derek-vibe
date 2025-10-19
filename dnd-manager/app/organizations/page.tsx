import { createClient } from "@/lib/supabase/server";
import { OrganizationsIndex, type OrganizationRecord } from "@/components/ui/organizations-index";

export default async function OrganizationsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, description, logo_url, created_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const organizations = (data ?? []) as OrganizationRecord[];

  return <OrganizationsIndex organizations={organizations} />;
}
