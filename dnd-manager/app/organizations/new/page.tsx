import { OrganizationForm } from "@/components/organizations/organization-form";
import { createOrganization } from "@/lib/actions/organizations";
import { createClient } from "@/lib/supabase/server";
import { formatDateStringForDisplay } from "@/lib/utils";

export default async function NewOrganizationPage() {
  const supabase = await createClient();

  const [campaignsResult, sessionsResult, charactersResult] = await Promise.all([
    supabase.from("campaigns").select("id, name").order("name"),
    supabase
      .from("sessions")
      .select("id, name, session_date")
      .order("session_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("characters")
      .select("id, name, player_type, status")
      .order("name"),
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-[#00ffff] uppercase tracking-wider">
          Create Group
        </h2>
      </div>

      <OrganizationForm
        action={createOrganization}
        cancelHref="/organizations"
        submitLabel="Save Group"
        campaignOptions={campaignOptions}
        sessionOptions={sessionOptions}
        characterOptions={characterOptions}
      />
    </div>
  );
}
