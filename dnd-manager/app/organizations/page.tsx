import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface OrganizationRecord {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  created_at: string;
}

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

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-[0.35em] text-[#00ffff]">
            Organizations
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#94a3b8]">
            Group campaigns, sessions, and characters under shared banners. Each organization can own
            multiple storylines, factions, or tables, keeping your notes focused and easy to browse.
          </p>
        </div>
        <div>
          <Link
            href="/organizations/new"
            className="inline-flex items-center justify-center rounded border border-[#00ffff] border-opacity-40 px-4 py-2 text-xs font-bold uppercase tracking-[0.35em] text-[#00ffff] transition-colors hover:border-[#ff00ff] hover:text-[#ff00ff]"
          >
            New Organization
          </Link>
        </div>
      </header>

      {organizations.length === 0 ? (
        <div className="rounded border border-dashed border-[#00ffff]/30 bg-[#0f0f23] p-8 text-center text-sm text-[#94a3b8]">
          No organizations yet. Create one to start grouping your campaigns and characters.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {organizations.map((organization) => (
            <article
              key={organization.id}
              className="group flex flex-col gap-4 rounded border border-[#00ffff]/20 bg-[#0f0f23] p-6 shadow-[0_0_25px_rgba(0,255,255,0.05)] transition-all duration-200 hover:border-[#ff00ff]/40 hover:shadow-[0_0_35px_rgba(255,0,255,0.12)]"
            >
              <div className="flex items-center gap-4">
                {organization.logo_url ? (
                  <div className="relative h-14 w-14 overflow-hidden rounded border border-[#00ffff]/30 bg-[#050517]">
                    <Image
                      src={organization.logo_url}
                      alt={`${organization.name} logo`}
                      fill
                      sizes="56px"
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded border border-[#00ffff]/20 bg-[#050517] text-xl text-[#00ffff]">
                    🏛
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold uppercase tracking-[0.25em] text-[#00ffff]">
                    {organization.name}
                  </h2>
                  <p className="mt-1 text-xs uppercase tracking-[0.35em] text-[#64748b]">
                    Established {new Date(organization.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {organization.description ? (
                <p className="text-sm leading-relaxed text-[#cbd5f5]">
                  {organization.description}
                </p>
              ) : (
                <p className="text-sm text-[#64748b]">
                  No description yet. Edit this organization to add background details.
                </p>
              )}
              <div className="mt-auto">
                <Link
                  href={`/organizations/${organization.id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-[#00ffff] transition-colors hover:text-[#ff00ff]"
                >
                  View Details
                  <span aria-hidden className="text-base">
                    ⇢
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
