"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export type OrganizationRecord = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  created_at: string;
};

type OrganizationsIndexProps = {
  organizations: OrganizationRecord[];
};

export function OrganizationsIndex({ organizations }: OrganizationsIndexProps) {
  const [query, setQuery] = useState("");
  const hasOrganizations = organizations.length > 0;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredOrganizations = useMemo(() => {
    if (!normalizedQuery) {
      return organizations;
    }

    return organizations.filter((organization) => {
      const haystack = [
        organization.name,
        organization.description ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, organizations]);

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-extrabold uppercase tracking-[0.35em] text-[#00ffff]">
          Groups
        </h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          <label className="sr-only" htmlFor="organization-search">
            Search groups
          </label>
          <input
            id="organization-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            type="search"
            disabled={!hasOrganizations}
            className="h-9 w-full rounded border border-[#00ffff] border-opacity-40 bg-[#0f0f23] px-3 font-mono text-xs uppercase tracking-wider text-[#00ffff] placeholder:text-[#00ffff]/60 focus:border-[#ff00ff] focus:outline-none focus:ring-1 focus:ring-[#ff00ff] disabled:border-opacity-20 disabled:text-[#00ffff]/40 sm:w-52"
          />
          <Link
            href="/organizations/new"
            className="w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-xs sm:text-sm sm:px-5 sm:py-2.5 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50 text-center"
          >
            + New Group
          </Link>
        </div>
      </header>

      {!hasOrganizations ? (
        <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-12 text-center">
          <h3 className="text-lg font-medium text-[#00ffff] mb-2 uppercase tracking-wider">
            No groups yet
          </h3>
          <p className="text-gray-400 mb-6 font-mono">
            Create your first group to get started
          </p>
          <Link
            href="/organizations/new"
            className="inline-block w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50 text-center"
          >
            Create Group
          </Link>
        </div>
      ) : filteredOrganizations.length === 0 ? (
        <div className="rounded border border-dashed border-[#00ffff]/40 bg-[#0f0f23]/60 p-8 text-center">
          <p className="font-mono text-sm text-[#00ffff]/70">
            No groups matched your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((organization) => (
            <Link
              key={organization.id}
              href={`/organizations/${organization.id}`}
              className="group flex h-full flex-col gap-4 rounded-lg border border-[#00ffff] border-opacity-35 bg-[#0f1428] p-5 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[#00ffff] hover:shadow-[#00ffff]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff]"
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
                ) : null}
                <div className="min-w-0">
                  <h2 className="text-lg font-bold uppercase tracking-wider text-[#00ffff] transition-colors group-hover:text-[#ff00ff] break-words leading-tight">
                    {organization.name}
                  </h2>
                </div>
              </div>
              <div className="flex-1 text-sm leading-relaxed text-[#cbd5f5]">
                {organization.description ? (
                  <p className="line-clamp-4 text-[#cbd5f5]">
                    {organization.description}
                  </p>
                ) : (
                  <p className="text-[#64748b]">
                    No description yet. Edit this group to add background details.
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
