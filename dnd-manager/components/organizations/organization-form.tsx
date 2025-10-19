"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { EntityOption } from "@/components/ui/entity-multi-select";
import { EntityMultiSelect } from "@/components/ui/entity-multi-select";

const dedupeList = (values?: string[]) => Array.from(new Set((values ?? []).filter(Boolean)));
const listsMatch = (a: string[], b: string[]) => a.length === b.length && a.every((value, index) => value === b[index]);

interface OrganizationFormProps {
  action: (formData: FormData) => Promise<void>;
  cancelHref: string;
  defaultValues?: {
    name?: string;
    description?: string | null;
  };
  logoUrl?: string | null;
  submitLabel: string;
  showLogoRemove?: boolean;
  children?: ReactNode;
  campaignOptions?: EntityOption[];
  sessionOptions?: EntityOption[];
  characterOptions?: EntityOption[];
  defaultCampaignIds?: string[];
  defaultSessionIds?: string[];
  defaultCharacterIds?: string[];
}

export function OrganizationForm({
  action,
  cancelHref,
  defaultValues,
  logoUrl,
  submitLabel,
  showLogoRemove = false,
  children,
  campaignOptions = [],
  sessionOptions = [],
  characterOptions = [],
  defaultCampaignIds,
  defaultSessionIds,
  defaultCharacterIds,
}: OrganizationFormProps) {
  const [campaignIds, setCampaignIds] = useState<string[]>(() => dedupeList(defaultCampaignIds));
  const [sessionIds, setSessionIds] = useState<string[]>(() => dedupeList(defaultSessionIds));
  const [characterIds, setCharacterIds] = useState<string[]>(() => dedupeList(defaultCharacterIds));

  useEffect(() => {
    const next = dedupeList(defaultCampaignIds);
    setCampaignIds((current) => (listsMatch(current, next) ? current : next));
  }, [defaultCampaignIds]);

  useEffect(() => {
    const next = dedupeList(defaultSessionIds);
    setSessionIds((current) => (listsMatch(current, next) ? current : next));
  }, [defaultSessionIds]);

  useEffect(() => {
    const next = dedupeList(defaultCharacterIds);
    setCharacterIds((current) => (listsMatch(current, next) ? current : next));
  }, [defaultCharacterIds]);

  return (
    <form
      action={action}
      className="space-y-6 rounded border border-[#00ffff]/20 bg-[#0f0f23] p-6 shadow-[0_0_25px_rgba(0,255,255,0.08)]"
    >
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-xs font-bold uppercase tracking-[0.35em] text-[#00ffff]"
        >
          Group Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          maxLength={200}
          defaultValue={defaultValues?.name ?? ""}
          className="w-full rounded border border-[#00ffff]/30 bg-[#050517] px-4 py-3 text-[#e2e8f0] outline-none transition focus:border-[#ff00ff] focus:ring-2 focus:ring-[#ff00ff]/40"
          placeholder="Waterdeep Adventurers Guild"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-xs font-bold uppercase tracking-[0.35em] text-[#00ffff]"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaultValues?.description ?? ""}
          className="w-full rounded border border-[#00ffff]/30 bg-[#050517] px-4 py-3 text-[#e2e8f0] outline-none transition focus:border-[#ff00ff] focus:ring-2 focus:ring-[#ff00ff]/40"
          placeholder="Share the mission, history, or vibe of this group."
        />
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="logo"
            className="mb-2 block text-xs font-bold uppercase tracking-[0.35em] text-[#00ffff]"
          >
            Logo
          </label>
          <input
            type="file"
            id="logo"
            name="logo"
            accept="image/*"
            className="block w-full text-sm text-[#94a3b8] file:mr-4 file:rounded file:border-0 file:bg-[#00ffff] file:px-4 file:py-2 file:text-sm file:font-semibold file:tracking-[0.25em] file:text-black hover:file:bg-[#ff00ff]"
          />
        </div>

        {logoUrl ? (
          <div className="flex items-center gap-4 rounded border border-[#00ffff]/20 bg-[#050517] p-3">
            <div className="relative h-16 w-16 overflow-hidden rounded border border-[#00ffff]/30">
              <Image src={logoUrl} alt="Current logo" fill sizes="64px" className="object-contain" />
            </div>
            <div className="text-xs text-[#94a3b8]">
              <p className="font-semibold uppercase tracking-[0.3em] text-[#00ffff]">Current Logo</p>
              <p>Upload a new file to replace the existing image.</p>
            </div>
          </div>
        ) : null}

        {showLogoRemove && logoUrl ? (
          <label className="flex items-center gap-3 text-xs text-[#94a3b8]">
            <input
              type="checkbox"
              name="logo_remove"
              value="true"
              className="h-4 w-4 rounded border-[#00ffff]/40 bg-[#050517] text-[#ff00ff] focus:ring-[#ff00ff]"
            />
            Remove current logo
          </label>
        ) : null}
      </div>

      {(campaignOptions.length > 0 || sessionOptions.length > 0 || characterOptions.length > 0) && (
        <div className="space-y-6">
          {campaignOptions.length > 0 ? (
            <section className="space-y-3">
              <div>
                <span className="text-sm font-bold uppercase tracking-[0.35em] text-[#00ffff]">
                  Linked Campaigns
                </span>
              </div>
              <EntityMultiSelect
                id="organization-campaigns"
                name="campaign_ids"
                options={campaignOptions}
                value={campaignIds}
                onChange={setCampaignIds}
                placeholder="Select campaigns"
                emptyMessage="No campaigns available"
              />
            </section>
          ) : null}

          {sessionOptions.length > 0 ? (
            <section className="space-y-3">
              <div>
                <span className="text-sm font-bold uppercase tracking-[0.35em] text-[#00ffff]">
                  Linked Sessions
                </span>
              </div>
              <EntityMultiSelect
                id="organization-sessions"
                name="session_ids"
                options={sessionOptions}
                value={sessionIds}
                onChange={setSessionIds}
                placeholder="Select sessions"
                emptyMessage="No sessions available"
              />
            </section>
          ) : null}

          {characterOptions.length > 0 ? (
            <section className="space-y-3">
              <div>
                <span className="text-sm font-bold uppercase tracking-[0.35em] text-[#00ffff]">
                  Linked Characters
                </span>
              </div>
              <EntityMultiSelect
                id="organization-characters"
                name="character_ids"
                options={characterOptions}
                value={characterIds}
                onChange={setCharacterIds}
                placeholder="Select characters"
                emptyMessage="No characters available"
              />
            </section>
          ) : null}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="submit"
          className="flex-1 px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base font-bold rounded text-black bg-[#ff00ff] hover:bg-[#cc00cc] focus:outline-none focus:ring-2 focus:ring-[#ff00ff] transition-all duration-200 uppercase tracking-wider shadow-lg shadow-[#ff00ff]/50"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="flex-1 px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base font-bold rounded text-[#00ffff] border border-[#00ffff] border-opacity-30 hover:bg-[#1a1a3e] hover:border-[#ff00ff] hover:text-[#ff00ff] focus:outline-none transition-all duration-200 uppercase tracking-wider text-center"
        >
          Cancel
        </Link>
      </div>

      {children}
    </form>
  );
}
