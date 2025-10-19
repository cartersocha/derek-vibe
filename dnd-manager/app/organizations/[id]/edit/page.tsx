import Link from "next/link";
import { notFound } from "next/navigation";
import { OrganizationForm } from "@/components/organizations/organization-form";
import { updateOrganization } from "@/lib/actions/organizations";
import { createClient } from "@/lib/supabase/server";
import { formatDateStringForDisplay } from "@/lib/utils";

export default async function EditOrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, description, logo_url")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      notFound();
    }
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  const organization = data;

  const [campaignsResult, sessionsResult, charactersResult, campaignLinksResult, sessionLinksResult, characterLinksResult] =
    await Promise.all([
      supabase.from("campaigns").select("id, name").order("name"),
      supabase.from("sessions").select("id, name, session_date").order("session_date", { ascending: false, nullsFirst: false }),
      supabase.from("characters").select("id, name, player_type, status").order("name"),
      supabase.from("organization_campaigns").select("campaign_id").eq("organization_id", id),
      supabase.from("organization_sessions").select("session_id").eq("organization_id", id),
      supabase.from("organization_characters").select("character_id").eq("organization_id", id),
    ]);

  const campaignOptions = (campaignsResult.data ?? []).map((campaign) => ({
    value: campaign.id,
    label: campaign.name ?? "Untitled Campaign",
  }));

  const sessionOptions = (sessionsResult.data ?? []).map((session) => ({
    value: session.id,
    label: session.name ?? "Untitled Session",
    hint: formatDateStringForDisplay(session.session_date) ?? "Date TBD",
  }));

  const characterOptions = (charactersResult.data ?? []).map((character) => {
    const playerTypeLabel = character.player_type === "player" ? "Player" : "NPC";
    const statusLabel = character.status
      ? character.status.replace(/^[a-z]/, (match: string) => match.toUpperCase())
      : "Unknown";
    return {
      value: character.id,
      label: character.name ?? "Unnamed Character",
      hint: `${playerTypeLabel} · ${statusLabel}`,
    };
  });

  const defaultCampaignIds = (campaignLinksResult.data ?? []).map((entry) => entry.campaign_id).filter(Boolean);
  const defaultSessionIds = (sessionLinksResult.data ?? []).map((entry) => entry.session_id).filter(Boolean);
  const defaultCharacterIds = (characterLinksResult.data ?? []).map((entry) => entry.character_id).filter(Boolean);

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateOrganization(id, formData);
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/organizations/${id}`}
          className="text-[#00ffff] hover:text-[#ff00ff] font-mono uppercase tracking-wider"
        >
          ← Back to Group
        </Link>
      </div>

      <div className="space-y-2">
  <h2 className="text-2xl font-bold text-[#00ffff] uppercase tracking-wider">Edit Group</h2>
        <p className="text-sm text-[#94a3b8]">
          Update the details below or replace the current logo. Removing the logo falls back to the default icon.
        </p>
      </div>

      <OrganizationForm
        action={handleUpdate}
        cancelHref={`/organizations/${id}`}
        defaultValues={{ name: organization.name, description: organization.description }}
        logoUrl={organization.logo_url}
        campaignOptions={campaignOptions}
        sessionOptions={sessionOptions}
        characterOptions={characterOptions}
        defaultCampaignIds={defaultCampaignIds}
        defaultSessionIds={defaultSessionIds}
        defaultCharacterIds={defaultCharacterIds}
        showLogoRemove
        submitLabel="Save Changes"
      />
    </div>
  );
}
