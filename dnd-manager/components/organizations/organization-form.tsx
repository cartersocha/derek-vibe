"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { EntityOption } from "@/components/ui/entity-multi-select";
import SimpleCharacterMultiSelect from "@/components/ui/simple-character-multi-select";
import SimpleSessionMultiSelect from "@/components/ui/simple-session-multi-select";
import SimpleCampaignMultiSelect from "@/components/ui/simple-campaign-multi-select";
import MentionableTextarea from "@/components/ui/mentionable-textarea";
import type { MentionTarget } from "@/lib/mention-utils";
import { useConvertedOptions, dedupeList } from "@/lib/utils/form-optimization";

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
  mentionTargets?: MentionTarget[];
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
  mentionTargets = [],
}: OrganizationFormProps) {
  const [campaignIds, setCampaignIds] = useState<string[]>(() => dedupeList(defaultCampaignIds));
  const [sessionIds, setSessionIds] = useState<string[]>(() => dedupeList(defaultSessionIds));
  const [characterIds, setCharacterIds] = useState<string[]>(() => dedupeList(defaultCharacterIds));
  const [mentionableTargets, setMentionableTargets] = useState<MentionTarget[]>(mentionTargets);
  const defaultsAppliedSignatureRef = useRef<string | null>(null);
  // Update mentionable targets when props change
  useEffect(() => {
    setMentionableTargets((previous) => {
      const merged = new Map<string, MentionTarget>();
      mentionTargets.forEach((target) => {
        merged.set(target.id, target);
      });
      previous.forEach((target) => {
        merged.set(target.id, target);
      });
      return Array.from(merged.values());
    });
  }, [mentionTargets]);

  // Convert EntityOption arrays to specialized option types (memoized for performance)
  const { campaignOptionsConverted, sessionOptionsConverted, characterOptionsConverted } = useConvertedOptions(
    campaignOptions,
    sessionOptions,
    characterOptions
  );

  const [campaignOptionList, setCampaignOptionList] = useState(() => campaignOptionsConverted);
  const [sessionOptionList, setSessionOptionList] = useState(() => sessionOptionsConverted);
  const [characterOptionList, setCharacterOptionList] = useState(() => characterOptionsConverted);

  const normalizedDefaultSelections = useMemo(() => {
    const dedupedCampaigns = dedupeList(defaultCampaignIds);
    const dedupedSessions = dedupeList(defaultSessionIds);
    const dedupedCharacters = dedupeList(defaultCharacterIds);
    const signature = JSON.stringify({
      campaigns: dedupedCampaigns,
      sessions: dedupedSessions,
      characters: dedupedCharacters,
    });
    return {
      campaigns: dedupedCampaigns,
      sessions: dedupedSessions,
      characters: dedupedCharacters,
      signature,
    };
  }, [defaultCampaignIds, defaultSessionIds, defaultCharacterIds]);

  useEffect(() => {
    setCampaignOptionList((previous) => {
      const merged = new Map(previous.map((option) => [option.value, option]));
      campaignOptionsConverted.forEach((option) => {
        merged.set(option.value, option);
      });
      return Array.from(merged.values());
    });
  }, [campaignOptionsConverted]);

  useEffect(() => {
    setSessionOptionList((previous) => {
      const merged = new Map(previous.map((option) => [option.value, option]));
      sessionOptionsConverted.forEach((option) => {
        merged.set(option.value, option);
      });
      return Array.from(merged.values());
    });
  }, [sessionOptionsConverted]);

  useEffect(() => {
    setCharacterOptionList((previous) => {
      const merged = new Map(previous.map((option) => [option.value, option]));
      characterOptionsConverted.forEach((option) => {
        merged.set(option.value, option);
      });
      return Array.from(merged.values());
    });
  }, [characterOptionsConverted]);

  // Inline creation handlers
  const addCharacterLink = useCallback((id: string, name: string) => {
    setCharacterIds((prev) => {
      if (prev.includes(id)) {
        return prev;
      }
      return [...prev, id];
    });

    setCharacterOptionList((previous) => {
      if (previous.some((entry) => entry.value === id)) {
        return previous;
      }
      return [
        ...previous,
        {
          value: id,
          label: name,
          hint: null,
        },
      ];
    });
  }, []);

  const addSessionLink = useCallback((id: string, name: string) => {
    setSessionIds((prev) => {
      if (prev.includes(id)) {
        return prev;
      }
      return [...prev, id];
    });

    setSessionOptionList((previous) => {
      if (previous.some((entry) => entry.value === id)) {
        return previous;
      }
      return [
        ...previous,
        {
          value: id,
          label: name,
          hint: null,
        },
      ];
    });
  }, []);

  const addCampaignLink = useCallback((id: string, name: string) => {
    setCampaignIds((prev) => {
      if (prev.includes(id)) {
        return prev;
      }
      return [...prev, id];
    });

    setCampaignOptionList((previous) => {
      if (previous.some((entry) => entry.value === id)) {
        return previous;
      }
      return [
        ...previous,
        {
          value: id,
          label: name,
          hint: null,
        },
      ];
    });
  }, []);

  const handleCharacterCreated = useCallback((option: { value: string; label: string }) => {
    addCharacterLink(option.value, option.label);
  }, [addCharacterLink]);

  const handleSessionCreated = useCallback((option: { value: string; label: string }) => {
    addSessionLink(option.value, option.label);
  }, [addSessionLink]);

  const handleCampaignCreated = useCallback((option: { value: string; label: string }) => {
    addCampaignLink(option.value, option.label);
  }, [addCampaignLink]);

  const handleMentionInsert = (target: MentionTarget) => {
    setMentionableTargets((previous) => {
      if (previous.some((entry) => entry.id === target.id)) {
        return previous;
      }
      return [...previous, target];
    });

    if (target.kind === 'character') {
      // Add character to the list if not already present
      addCharacterLink(target.id, target.name);
    } else if (target.kind === 'campaign') {
      // Add campaign to the list if not already present
      addCampaignLink(target.id, target.name);
    } else if (target.kind === 'session') {
      // Add session to the list if not already present
      addSessionLink(target.id, target.name);
    } else if (target.kind === 'organization') {
      // For organizations, we don't auto-assign to avoid circular references
      // Just add to mentionable targets for future @ mentions
    }
  };

  useEffect(() => {
    if (!normalizedDefaultSelections.signature) {
      return;
    }
    if (defaultsAppliedSignatureRef.current === normalizedDefaultSelections.signature) {
      return;
    }

    defaultsAppliedSignatureRef.current = normalizedDefaultSelections.signature;
    setCampaignIds(normalizedDefaultSelections.campaigns);
    setSessionIds(normalizedDefaultSelections.sessions);
    setCharacterIds(normalizedDefaultSelections.characters);
  }, [normalizedDefaultSelections]);

  return (
    <form
      action={action}
      className="space-y-6 bg-[var(--bg-card)] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 shadow-2xl p-6"
    >
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-xs font-bold uppercase tracking-[0.35em] text-[var(--cyber-cyan)]"
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
          className="w-full rounded border border-[var(--cyber-cyan)]/30 bg-[var(--bg-dark)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--cyber-magenta)] focus:ring-2 focus:ring-[var(--cyber-magenta)]/40"
          placeholder="Waterdeep Adventurers Guild"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-xs font-bold uppercase tracking-[0.35em] text-[var(--cyber-cyan)]"
        >
          Description
        </label>
        <MentionableTextarea
          id="description"
          name="description"
          rows={4}
          initialValue={defaultValues?.description ?? ""}
          mentionTargets={mentionableTargets}
          onMentionInsert={handleMentionInsert}
          onMentionCreate={handleMentionInsert}
          className="w-full rounded border border-[var(--cyber-cyan)]/30 bg-[var(--bg-dark)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--cyber-magenta)] focus:ring-2 focus:ring-[var(--cyber-magenta)]/40"
          placeholder="Share the mission, history, or vibe of this group."
        />
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="logo"
            className="mb-2 block text-xs font-bold uppercase tracking-[0.35em] text-[var(--cyber-cyan)]"
          >
            Logo
          </label>
          <input
            type="file"
            id="logo"
            name="logo"
            accept="image/*"
            className="block w-full text-sm text-[var(--text-secondary)] file:mr-4 file:rounded file:border-0 file:bg-[var(--cyber-cyan)] file:px-4 file:py-2 file:text-sm file:font-semibold file:tracking-[0.25em] file:text-black hover:file:bg-[var(--cyber-magenta)]"
          />
        </div>

        {logoUrl ? (
          <div className="flex items-center gap-4 rounded border border-[var(--cyber-cyan)]/20 bg-[var(--bg-dark)] p-3">
            <div className="relative h-16 w-16 overflow-hidden rounded border border-[var(--cyber-cyan)]/30">
              <Image src={logoUrl} alt="Current logo" fill sizes="64px" className="object-contain" />
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              <p className="font-semibold uppercase tracking-[0.3em] text-[var(--cyber-cyan)]">Current Logo</p>
              <p>Upload a new file to replace the existing image.</p>
            </div>
          </div>
        ) : null}

        {showLogoRemove && logoUrl ? (
          <label className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
            <input
              type="checkbox"
              name="logo_remove"
              value="true"
              className="h-4 w-4 rounded border-[var(--cyber-cyan)]/40 bg-[var(--bg-dark)] text-[var(--cyber-magenta)] focus:ring-[var(--cyber-magenta)]"
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
                <span className="text-sm font-bold uppercase tracking-[0.35em] text-[var(--cyber-cyan)]">
                  Linked Campaigns
                </span>
              </div>
              <SimpleCampaignMultiSelect
                id="organization-campaigns"
                name="campaign_ids"
                options={campaignOptionList}
                value={campaignIds}
                onChange={setCampaignIds}
                placeholder="Select campaigns"
                emptyMessage="No campaigns available"
                onCreateOption={handleCampaignCreated}
              />
            </section>
          ) : null}

          {sessionOptions.length > 0 ? (
            <section className="space-y-3">
              <div>
                <span className="text-sm font-bold uppercase tracking-[0.35em] text-[var(--cyber-cyan)]">
                  Linked Sessions
                </span>
              </div>
              <SimpleSessionMultiSelect
                id="organization-sessions"
                name="session_ids"
                options={sessionOptionList}
                value={sessionIds}
                onChange={setSessionIds}
                placeholder="Select sessions"
                emptyMessage="No sessions available"
                onCreateOption={handleSessionCreated}
              />
            </section>
          ) : null}

          {characterOptions.length > 0 ? (
            <section className="space-y-3">
              <div>
                <span className="text-sm font-bold uppercase tracking-[0.35em] text-[var(--cyber-cyan)]">
                  Linked Characters
                </span>
              </div>
              <SimpleCharacterMultiSelect
                id="organization-characters"
                name="character_ids"
                options={characterOptionList}
                value={characterIds}
                onChange={setCharacterIds}
                placeholder="Select characters"
                emptyMessage="No characters available"
                onCreateOption={handleCharacterCreated}
              />
            </section>
          ) : null}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <button
          type="submit"
          className="w-full sm:flex-1 px-4 py-3 text-sm sm:text-base font-bold rounded text-black bg-[var(--cyber-magenta)] hover:bg-[var(--cyber-magenta)]/80 focus:outline-none focus:ring-2 focus:ring-[var(--cyber-magenta)] transition-all duration-200 uppercase tracking-wider shadow-lg shadow-[var(--cyber-magenta)]/50"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="w-full sm:flex-1 px-4 py-3 text-sm sm:text-base font-bold rounded text-[var(--cyber-cyan)] border border-[var(--cyber-cyan)] border-opacity-30 hover:bg-[var(--bg-card)] hover:border-[var(--cyber-magenta)] hover:text-[var(--cyber-magenta)] focus:outline-none transition-all duration-200 uppercase tracking-wider text-center"
        >
          Cancel
        </Link>
      </div>

      {children}
    </form>
  );
}
