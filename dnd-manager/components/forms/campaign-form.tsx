"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { coerceDateInputValue } from "@/lib/utils";
import OrganizationMultiSelect from "@/components/ui/organization-multi-select";
import CharacterMultiSelect, { type CharacterOption } from "@/components/ui/character-multi-select";
import SessionMultiSelect, { type SessionOption } from "@/components/ui/session-multi-select";
import MentionableTextarea from "@/components/ui/mentionable-textarea";
import type { MentionTarget } from "@/lib/mention-utils";

const dedupe = (values?: string[]) => Array.from(new Set((values ?? []).filter(Boolean)));

type OptionInput = {
  id: string;
  name: string;
  hint?: string | null;
};

type SessionInput = OptionInput & {
  characterIds?: string[];
  organizationIds?: string[];
};

interface CampaignFormProps {
  action: (formData: FormData) => Promise<void>;
  cancelHref: string;
  submitLabel: string;
  defaultValues?: {
    name?: string;
    description?: string | null;
    createdAt?: string | null;
  };
  organizations?: OptionInput[];
  sessions?: SessionInput[];
  characters?: OptionInput[];
  defaultOrganizationIds?: string[];
  defaultSessionIds?: string[];
  defaultCharacterIds?: string[];
  campaignId?: string;
  mentionTargets?: MentionTarget[];
}

export function CampaignForm({
  action,
  cancelHref,
  submitLabel,
  defaultValues,
  organizations = [],
  sessions = [],
  characters = [],
  defaultOrganizationIds,
  defaultSessionIds,
  defaultCharacterIds,
  campaignId,
  mentionTargets = [],
}: CampaignFormProps) {
  const sortOptionInputs = useCallback(
    (list: OptionInput[]) =>
      [...list].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" })),
    []
  );

  const [organizationIds, setOrganizationIds] = useState<string[]>(() => dedupe(defaultOrganizationIds));
  const [sessionIds, setSessionIds] = useState<string[]>(() => dedupe(defaultSessionIds));
  const [characterIds, setCharacterIds] = useState<string[]>(() => dedupe(defaultCharacterIds));
  const [organizationList, setOrganizationList] = useState<OptionInput[]>(() => sortOptionInputs([...organizations]));
  const [sessionList, setSessionList] = useState<SessionInput[]>(() => sortOptionInputs([...sessions]));
  const [characterList, setCharacterList] = useState<OptionInput[]>(() => sortOptionInputs([...characters]));
  const defaultCreatedAtValue = useMemo(() => coerceDateInputValue(defaultValues?.createdAt ?? null), [defaultValues?.createdAt]);
  const [mentionableTargets, setMentionableTargets] = useState<MentionTarget[]>(mentionTargets);

  // Track manually selected characters and organizations (not auto-added from sessions)
  const manuallySelectedCharsRef = useRef<Set<string>>(new Set());
  const manuallySelectedOrgsRef = useRef<Set<string>>(new Set());
  const defaultsAppliedSignatureRef = useRef<string | null>(null);
  const [manualSelectionTrigger, setManualSelectionTrigger] = useState(0);

  const defaultSelections = useMemo(() => {
    const orgs = dedupe(defaultOrganizationIds);
    const sessionsSelection = dedupe(defaultSessionIds);
    const chars = dedupe(defaultCharacterIds);
    const signature = JSON.stringify({
      orgs,
      sessions: sessionsSelection,
      chars,
    });
    return { orgs, sessions: sessionsSelection, chars, signature };
  }, [defaultCharacterIds, defaultOrganizationIds, defaultSessionIds]);

  useEffect(() => {
    setMentionableTargets((previous) => {
      if (!mentionTargets.length) {
        return previous;
      }
      const merged = new Map<string, MentionTarget>();
      previous.forEach((target) => {
        merged.set(`${target.kind}:${target.id}`, target);
      });
      mentionTargets.forEach((target) => {
        merged.set(`${target.kind}:${target.id}`, target);
      });
      return Array.from(merged.values());
    });
  }, [mentionTargets]);

  useEffect(() => {
    setOrganizationList(sortOptionInputs([...organizations]));
  }, [organizations, sortOptionInputs]);

  useEffect(() => {
    setSessionList(sortOptionInputs([...sessions]));
  }, [sessions, sortOptionInputs]);

  useEffect(() => {
    setCharacterList(sortOptionInputs([...characters]));
  }, [characters, sortOptionInputs]);

  // Initialize manually selected characters and organizations from initial state
  useEffect(() => {
    if (!defaultSelections.signature) {
      return;
    }
    if (defaultsAppliedSignatureRef.current === defaultSelections.signature) {
      return;
    }

    defaultsAppliedSignatureRef.current = defaultSelections.signature;

    setOrganizationIds(defaultSelections.orgs);
    setSessionIds(defaultSelections.sessions);
    setCharacterIds(defaultSelections.chars);

    const charsFromSessions = new Set<string>();
    const orgsFromSessions = new Set<string>();

    defaultSelections.sessions.forEach((sessionId) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        session.characterIds?.forEach((cid) => charsFromSessions.add(cid));
        session.organizationIds?.forEach((oid) => orgsFromSessions.add(oid));
      }
    });

    const manualChars = new Set<string>();
    defaultSelections.chars.forEach((charId) => {
      if (!charsFromSessions.has(charId)) {
        manualChars.add(charId);
      }
    });

    const manualOrgs = new Set<string>();
    defaultSelections.orgs.forEach((orgId) => {
      if (!orgsFromSessions.has(orgId)) {
        manualOrgs.add(orgId);
      }
    });

    manuallySelectedCharsRef.current = manualChars;
    manuallySelectedOrgsRef.current = manualOrgs;
    setManualSelectionTrigger((prev) => prev + 1);
  }, [defaultSelections, sessions]);

  // Auto-sync characters and organizations from selected sessions
  useEffect(() => {
    // Collect characters and organizations from selected sessions
    const charsFromSessions = new Set<string>();
    const orgsFromSessions = new Set<string>();

    sessionIds.forEach((sessionId) => {
      const session = sessionList.find((s) => s.id === sessionId);
      if (session) {
        session.characterIds?.forEach((charId) => charsFromSessions.add(charId));
        session.organizationIds?.forEach((orgId) => orgsFromSessions.add(orgId));
      }
    });

    // Update character IDs: combine session characters with manually selected ones
    setCharacterIds((prev) => {
      const combined = new Set([
        ...charsFromSessions,
        ...manuallySelectedCharsRef.current,
      ]);

      const prevSet = new Set(prev);
      if (combined.size !== prevSet.size) {
        return Array.from(combined);
      }

      for (const id of combined) {
        if (!prevSet.has(id)) {
          return Array.from(combined);
        }
      }

      for (const id of prevSet) {
        if (!combined.has(id)) {
          return Array.from(combined);
        }
      }

      return prev;
    });

    // Update organization IDs: combine session organizations with manually selected ones
    setOrganizationIds((prev) => {
      const combined = new Set([
        ...orgsFromSessions,
        ...manuallySelectedOrgsRef.current,
      ]);

      const prevSet = new Set(prev);
      if (combined.size !== prevSet.size) {
        return Array.from(combined);
      }

      for (const id of combined) {
        if (!prevSet.has(id)) {
          return Array.from(combined);
        }
      }

      for (const id of prevSet) {
        if (!combined.has(id)) {
          return Array.from(combined);
        }
      }

      return prev;
    });
  }, [sessionIds, sessionList, manualSelectionTrigger]);

  const applyOrganizationMention = useCallback((id: string, name: string) => {
    if (!id) {
      return;
    }

    setOrganizationList((prev) => {
      if (prev.some((entry) => entry.id === id)) {
        return prev;
      }
      const next = [...prev, { id, name }];
      return sortOptionInputs(next);
    });

    setOrganizationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    if (!manuallySelectedOrgsRef.current.has(id)) {
      manuallySelectedOrgsRef.current.add(id);
      setManualSelectionTrigger((prev) => prev + 1);
    }
  }, [sortOptionInputs]);

  const applySessionMention = useCallback((id: string, name: string, hint?: string | null) => {
    if (!id) {
      return;
    }

    setSessionList((prev) => {
      if (prev.some((entry) => entry.id === id)) {
        return prev;
      }
      const next = [...prev, { id, name, hint: hint ?? null }];
      return sortOptionInputs(next);
    });

    setSessionIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, [sortOptionInputs]);

  const applyCharacterMention = useCallback((id: string, name: string, hint?: string | null) => {
    if (!id) {
      return;
    }

    setCharacterList((prev) => {
      if (prev.some((entry) => entry.id === id)) {
        return prev;
      }
      const next = [...prev, { id, name, hint: hint ?? null }];
      return sortOptionInputs(next);
    });

    setCharacterIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    if (!manuallySelectedCharsRef.current.has(id)) {
      manuallySelectedCharsRef.current.add(id);
      setManualSelectionTrigger((prev) => prev + 1);
    }
  }, [sortOptionInputs]);

  const handleOrganizationCreated = useCallback((option: { value: string; label: string }) => {
    setOrganizationList((prev) => {
      if (prev.some((entry) => entry.id === option.value)) {
        return prev;
      }
      const next = [...prev, { id: option.value, name: option.label }];
      return sortOptionInputs(next);
    });

    // Mark as manually selected and trigger sync
    if (!manuallySelectedOrgsRef.current.has(option.value)) {
      manuallySelectedOrgsRef.current.add(option.value);
      setManualSelectionTrigger((prev) => prev + 1);
    }

    setMentionableTargets((previous) => {
      const key = `organization:${option.value}`;
      if (previous.some((entry) => `${entry.kind}:${entry.id}` === key)) {
        return previous;
      }
      return [
        ...previous,
        {
          id: option.value,
          name: option.label,
          href: `/organizations/${option.value}`,
          kind: "organization" as const,
        },
      ];
    });
  }, [sortOptionInputs]);

  const handleSessionCreated = useCallback((option: SessionOption) => {
    setSessionList((prev) => {
      if (prev.some((entry) => entry.id === option.value)) {
        return prev;
      }
      const next = [...prev, { id: option.value, name: option.label, hint: option.hint ?? null }];
      return sortOptionInputs(next);
    });

    setSessionIds((prev) => (prev.includes(option.value) ? prev : [...prev, option.value]));

    setMentionableTargets((previous) => {
      const key = `session:${option.value}`;
      if (previous.some((entry) => `${entry.kind}:${entry.id}` === key)) {
        return previous;
      }
      return [
        ...previous,
        {
          id: option.value,
          name: option.label,
          href: `/sessions/${option.value}`,
          kind: "session" as const,
        },
      ];
    });
  }, [sortOptionInputs]);

  const handleCharacterCreated = useCallback((option: CharacterOption) => {
    setCharacterList((prev) => {
      if (prev.some((entry) => entry.id === option.value)) {
        return prev;
      }
      const next = [...prev, { id: option.value, name: option.label, hint: option.hint ?? null }];
      return sortOptionInputs(next);
    });

    // Mark as manually selected and trigger sync
    if (!manuallySelectedCharsRef.current.has(option.value)) {
      manuallySelectedCharsRef.current.add(option.value);
      setManualSelectionTrigger((prev) => prev + 1);
    }

    setMentionableTargets((previous) => {
      const key = `character:${option.value}`;
      if (previous.some((entry) => `${entry.kind}:${entry.id}` === key)) {
        return previous;
      }
      return [
        ...previous,
        {
          id: option.value,
          name: option.label,
          href: `/characters/${option.value}`,
          kind: "character" as const,
        },
      ];
    });
  }, [sortOptionInputs]);

  const handleMentionInsert = useCallback((target: MentionTarget) => {
    setMentionableTargets((previous) => {
      const key = `${target.kind}:${target.id}`;
      if (previous.some((entry) => `${entry.kind}:${entry.id}` === key)) {
        return previous;
      }
      return [...previous, target];
    });

    if (target.kind === "organization") {
      const existing = organizationList.find((entry) => entry.id === target.id);
      applyOrganizationMention(target.id, existing?.name ?? target.name);
    } else if (target.kind === "session") {
      const existing = sessionList.find((entry) => entry.id === target.id);
      applySessionMention(target.id, existing?.name ?? target.name, existing?.hint ?? null);
    } else if (target.kind === "character") {
      const existing = characterList.find((entry) => entry.id === target.id);
      applyCharacterMention(target.id, existing?.name ?? target.name, existing?.hint ?? null);
    }
  }, [applyCharacterMention, applyOrganizationMention, applySessionMention, characterList, organizationList, sessionList]);

  // Wrapped handler for character selection changes
  const handleCharacterIdsChange = useCallback((newCharacterIds: string[]) => {
    // Calculate which characters come from sessions
    const charsFromSessions = new Set<string>();
    sessionIds.forEach((sessionId) => {
      const session = sessionList.find((s) => s.id === sessionId);
      session?.characterIds?.forEach((charId) => charsFromSessions.add(charId));
    });

    const prevSet = new Set(characterIds);
    const newSet = new Set(newCharacterIds);

    let refChanged = false;

    // Find newly added characters (not from sessions) - mark as manual
    newSet.forEach((charId) => {
      if (!prevSet.has(charId) && !charsFromSessions.has(charId)) {
        manuallySelectedCharsRef.current.add(charId);
        refChanged = true;
      }
    });

    // Find removed characters that were manually selected
    prevSet.forEach((charId) => {
      if (!newSet.has(charId) && manuallySelectedCharsRef.current.has(charId)) {
        manuallySelectedCharsRef.current.delete(charId);
        refChanged = true;
      }
    });

    if (refChanged) {
      setManualSelectionTrigger((prev) => prev + 1);
    }

    setCharacterIds(newCharacterIds);
  }, [characterIds, sessionIds, sessionList]);

  // Wrapped handler for organization selection changes
  const handleOrganizationIdsChange = useCallback((newOrganizationIds: string[]) => {
    // Calculate which organizations come from sessions
    const orgsFromSessions = new Set<string>();
    sessionIds.forEach((sessionId) => {
      const session = sessionList.find((s) => s.id === sessionId);
      session?.organizationIds?.forEach((orgId) => orgsFromSessions.add(orgId));
    });

    const prevSet = new Set(organizationIds);
    const newSet = new Set(newOrganizationIds);

    let refChanged = false;

    // Find newly added organizations (not from sessions) - mark as manual
    newSet.forEach((orgId) => {
      if (!prevSet.has(orgId) && !orgsFromSessions.has(orgId)) {
        manuallySelectedOrgsRef.current.add(orgId);
        refChanged = true;
      }
    });

    // Find removed organizations that were manually selected
    prevSet.forEach((orgId) => {
      if (!newSet.has(orgId) && manuallySelectedOrgsRef.current.has(orgId)) {
        manuallySelectedOrgsRef.current.delete(orgId);
        refChanged = true;
      }
    });

    if (refChanged) {
      setManualSelectionTrigger((prev) => prev + 1);
    }

    setOrganizationIds(newOrganizationIds);
  }, [organizationIds, sessionIds, sessionList]);

  const organizationOptions = useMemo(() => {
    return organizationList
      .filter((entry): entry is OptionInput & { id: string; name: string } => Boolean(entry?.id && entry?.name))
      .map((entry) => ({ value: entry.id, label: entry.name ?? "Untitled Group" }));
  }, [organizationList]);

  const sessionOptions = useMemo<SessionOption[]>(() => {
    return sessionList
      .filter((entry): entry is OptionInput & { id: string; name: string } => Boolean(entry?.id && entry?.name))
      .map((entry) => ({ value: entry.id, label: entry.name ?? "Untitled Session", hint: entry.hint ?? null }));
  }, [sessionList]);

  const characterOptions = useMemo<CharacterOption[]>(() => {
    return characterList
      .filter((entry): entry is OptionInput & { id: string; name: string } => Boolean(entry?.id && entry?.name))
      .map((entry) => ({ value: entry.id, label: entry.name ?? "Unnamed Character", hint: entry.hint ?? null }));
  }, [characterList]);

  return (
    <form
      action={action}
      className="space-y-4 sm:space-y-6 rounded border border-[#00ffff]/20 bg-[#0f0f23] p-4 sm:p-6 shadow-[0_0_25px_rgba(0,255,255,0.08)]"
    >
      <input type="hidden" name="organization_field_present" value="true" />
      <input type="hidden" name="session_field_present" value="true" />
      <input type="hidden" name="character_field_present" value="true" />

      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-xs font-bold uppercase tracking-[0.35em] text-[#00ffff]"
        >
          Campaign Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          maxLength={200}
          defaultValue={defaultValues?.name ?? ""}
          className="w-full rounded border border-[#00ffff]/30 bg-[#050517] px-3 sm:px-4 py-3 text-[#e2e8f0] outline-none transition focus:border-[#ff00ff] focus:ring-2 focus:ring-[#ff00ff]/40 text-sm sm:text-base min-h-[44px]"
          placeholder="The Endpoint Exists"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-xs font-bold uppercase tracking-[0.35em] text-[#00ffff]"
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
          linkCampaignId={campaignId}
          className="w-full rounded border border-[#00ffff]/30 bg-[#050517] px-3 sm:px-4 py-3 text-[#e2e8f0] outline-none transition focus:border-[#ff00ff] focus:ring-2 focus:ring-[#ff00ff]/40 text-sm sm:text-base min-h-[100px]"
          placeholder="Describe the tone, goals, and hook for this campaign."
        />
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <div className="space-y-2 sm:space-y-3">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.35em] text-[#00ffff]">
            Created Date
          </span>
          <input
            type="date"
            id="created_at"
            name="created_at"
            defaultValue={defaultCreatedAtValue}
            className="w-full rounded border border-[#00ffff]/30 bg-[#050517] px-3 sm:px-4 py-3 text-[#e2e8f0] outline-none transition focus:border-[#ff00ff] focus:ring-2 focus:ring-[#ff00ff]/40 text-sm sm:text-base min-h-[44px]"
          />
        </div>

        <section className="space-y-2 sm:space-y-3">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.35em] text-[#00ffff]">
            Groups
          </span>
          <OrganizationMultiSelect
            id="campaign-organizations"
            name="organization_ids"
            options={organizationOptions}
            value={organizationIds}
            onChange={handleOrganizationIdsChange}
            placeholder={organizationOptions.length ? "Select groups" : "No groups available"}
            onCreateOption={handleOrganizationCreated}
          />
        </section>

        <section className="space-y-2 sm:space-y-3">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.35em] text-[#00ffff]">
            Sessions
          </span>
          <SessionMultiSelect
            id="campaign-sessions"
            name="session_ids"
            options={sessionOptions}
            value={sessionIds}
            onChange={setSessionIds}
            placeholder={sessionOptions.length ? "Select sessions" : "No sessions available"}
            onCreateOption={handleSessionCreated}
            campaignId={campaignId ?? null}
          />
        </section>

        <section className="space-y-2 sm:space-y-3">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.35em] text-[#00ffff]">
            Characters
          </span>
          <CharacterMultiSelect
            id="campaign-characters"
            name="character_ids"
            options={characterOptions}
            value={characterIds}
            onChange={handleCharacterIdsChange}
            placeholder={characterOptions.length ? "Select characters" : "No characters available"}
            onCreateOption={handleCharacterCreated}
          />
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row">
        <button
          type="submit"
          className="flex-1 px-4 py-3 text-sm sm:px-6 sm:py-3 sm:text-base font-bold rounded text-black bg-[#ff00ff] hover:bg-[#cc00cc] focus:outline-none focus:ring-2 focus:ring-[#ff00ff] transition-all duration-200 uppercase tracking-wider shadow-lg shadow-[#ff00ff]/50 min-h-[44px] flex items-center justify-center"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="flex-1 px-4 py-3 text-sm sm:px-6 sm:py-3 sm:text-base font-bold rounded text-[#00ffff] border border-[#00ffff] border-opacity-30 hover:bg-[#1a1a3e] hover:border-[#ff00ff] hover:text-[#ff00ff] focus:outline-none transition-all duration-200 uppercase tracking-wider text-center min-h-[44px] flex items-center justify-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
