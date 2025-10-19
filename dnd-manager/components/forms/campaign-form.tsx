"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { coerceDateInputValue } from "@/lib/utils";
import OrganizationMultiSelect from "@/components/ui/organization-multi-select";
import CharacterMultiSelect, { type CharacterOption } from "@/components/ui/character-multi-select";
import SessionMultiSelect, { type SessionOption } from "@/components/ui/session-multi-select";

const dedupe = (values?: string[]) => Array.from(new Set((values ?? []).filter(Boolean)));
const listsMatch = (a: string[], b: string[]) => a.length === b.length && a.every((value, index) => value === b[index]);

type OptionInput = {
  id: string;
  name: string;
  hint?: string | null;
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
  sessions?: OptionInput[];
  characters?: OptionInput[];
  defaultOrganizationIds?: string[];
  defaultSessionIds?: string[];
  defaultCharacterIds?: string[];
  campaignId?: string;
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
  const [sessionList, setSessionList] = useState<OptionInput[]>(() => sortOptionInputs([...sessions]));
  const [characterList, setCharacterList] = useState<OptionInput[]>(() => sortOptionInputs([...characters]));
  const defaultCreatedAtValue = useMemo(() => coerceDateInputValue(defaultValues?.createdAt ?? null), [defaultValues?.createdAt]);

  useEffect(() => {
    const next = dedupe(defaultOrganizationIds);
    setOrganizationIds((current) => (listsMatch(current, next) ? current : next));
  }, [defaultOrganizationIds]);

  useEffect(() => {
    const next = dedupe(defaultSessionIds);
    setSessionIds((current) => (listsMatch(current, next) ? current : next));
  }, [defaultSessionIds]);

  useEffect(() => {
    const next = dedupe(defaultCharacterIds);
    setCharacterIds((current) => (listsMatch(current, next) ? current : next));
  }, [defaultCharacterIds]);

  useEffect(() => {
    setOrganizationList(sortOptionInputs([...organizations]));
  }, [organizations, sortOptionInputs]);

  useEffect(() => {
    setSessionList(sortOptionInputs([...sessions]));
  }, [sessions, sortOptionInputs]);

  useEffect(() => {
    setCharacterList(sortOptionInputs([...characters]));
  }, [characters, sortOptionInputs]);

  const handleOrganizationCreated = useCallback((option: { value: string; label: string }) => {
    setOrganizationList((prev) => {
      if (prev.some((entry) => entry.id === option.value)) {
        return prev;
      }
      const next = [...prev, { id: option.value, name: option.label }];
      return sortOptionInputs(next);
    });

    setOrganizationIds((prev) => (prev.includes(option.value) ? prev : [...prev, option.value]));
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
  }, [sortOptionInputs]);

  const handleCharacterCreated = useCallback((option: CharacterOption) => {
    setCharacterList((prev) => {
      if (prev.some((entry) => entry.id === option.value)) {
        return prev;
      }
      const next = [...prev, { id: option.value, name: option.label, hint: option.hint ?? null }];
      return sortOptionInputs(next);
    });

    setCharacterIds((prev) => (prev.includes(option.value) ? prev : [...prev, option.value]));
  }, [sortOptionInputs]);

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
      className="space-y-6 rounded border border-[#00ffff]/20 bg-[#0f0f23] p-6 shadow-[0_0_25px_rgba(0,255,255,0.08)]"
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
          className="w-full rounded border border-[#00ffff]/30 bg-[#050517] px-4 py-3 text-[#e2e8f0] outline-none transition focus:border-[#ff00ff] focus:ring-2 focus:ring-[#ff00ff]/40"
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
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaultValues?.description ?? ""}
          className="w-full rounded border border-[#00ffff]/30 bg-[#050517] px-4 py-3 text-[#e2e8f0] outline-none transition focus:border-[#ff00ff] focus:ring-2 focus:ring-[#ff00ff]/40"
          placeholder="Describe the tone, goals, and hook for this campaign."
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <span className="text-sm font-bold uppercase tracking-[0.35em] text-[#00ffff]">
            Created Date
          </span>
          <input
            type="date"
            id="created_at"
            name="created_at"
            defaultValue={defaultCreatedAtValue}
            className="w-full rounded border border-[#00ffff]/30 bg-[#050517] px-4 py-3 text-[#e2e8f0] outline-none transition focus:border-[#ff00ff] focus:ring-2 focus:ring-[#ff00ff]/40"
          />
        </div>

        <section className="space-y-3">
          <span className="text-sm font-bold uppercase tracking-[0.35em] text-[#00ffff]">
            Groups
          </span>
          <OrganizationMultiSelect
            id="campaign-organizations"
            name="organization_ids"
            options={organizationOptions}
            value={organizationIds}
            onChange={setOrganizationIds}
            placeholder={organizationOptions.length ? "Select groups" : "No groups available"}
            onCreateOption={handleOrganizationCreated}
          />
        </section>

        <section className="space-y-3">
          <span className="text-sm font-bold uppercase tracking-[0.35em] text-[#00ffff]">
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

        <section className="space-y-3">
          <span className="text-sm font-bold uppercase tracking-[0.35em] text-[#00ffff]">
            Characters
          </span>
          <CharacterMultiSelect
            id="campaign-characters"
            name="character_ids"
            options={characterOptions}
            value={characterIds}
            onChange={setCharacterIds}
            placeholder={characterOptions.length ? "Select characters" : "No characters available"}
            onCreateOption={handleCharacterCreated}
          />
        </section>
      </div>

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
    </form>
  );
}
